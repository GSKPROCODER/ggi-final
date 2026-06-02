import { eq, and, count, desc, ilike, sql } from 'drizzle-orm';
import { db } from '../db';
import { records, datasets } from '../db/schema';
import { isTableMissingError } from '../errors';
import { clampLimit, MAX_ROWS } from './agent.util';

const GEMINI_AGENT_MODEL = 'gemini-2.5-flash';
const MAX_TURNS = 4;

export type AgentMessage = { role: 'user' | 'assistant'; content: string };
export type AgentLog = { type: string; content: string };

/* ------------------------------------------------------------------ *
 * Server-controlled data tools.
 *
 * The model never writes SQL. It only chooses a tool and supplies
 * parameters; every query below is built with the Drizzle query builder
 * and is unconditionally scoped to the signed-in `userId` (bound as a
 * value, never string-concatenated). This makes cross-tenant access and
 * prompt-injection-driven SQL impossible by construction.
 * ------------------------------------------------------------------ */

/** records filtered to this user, optionally to one dataset. */
function recordScope(userId: string, datasetId?: string) {
  const conds = [eq(records.userId, userId)];
  if (datasetId) conds.push(eq(records.datasetId, datasetId));
  return and(...conds);
}

async function getBreakdown(
  field: 'sentiment' | 'riskLevel' | 'emotion',
  userId: string,
  datasetId?: string,
): Promise<Record<string, number>> {
  const col = records[field];
  const rows = await db
    .select({ key: col, cnt: count() })
    .from(records)
    .where(recordScope(userId, datasetId))
    .groupBy(col);
  const out: Record<string, number> = {};
  for (const r of rows) if (r.key) out[r.key] = Number(r.cnt);
  return out;
}

async function getTopRecords(
  userId: string,
  args: { orderBy?: string; sentiment?: string; limit?: number },
) {
  const conds = [eq(records.userId, userId)];
  if (args.sentiment && ['Positive', 'Neutral', 'Negative'].includes(args.sentiment)) {
    conds.push(eq(records.sentiment, args.sentiment));
  }
  // ORDER BY uses only a constant CASE expression + a column reference —
  // no user input is interpolated into the SQL.
  const orderBy =
    args.orderBy === 'risk'
      ? [
          sql`CASE ${records.riskLevel} WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 1 ELSE 0 END DESC`,
          desc(records.createdAt),
        ]
      : [desc(records.createdAt)];

  const rows = await db.query.records.findMany({
    where: and(...conds),
    orderBy,
    limit: clampLimit(args.limit),
    columns: {
      text: true,
      summary: true,
      sentiment: true,
      emotion: true,
      riskLevel: true,
      confidenceScore: true,
    },
  });

  return rows.map((r) => ({
    text: r.text.slice(0, 300),
    summary: r.summary,
    sentiment: r.sentiment,
    emotion: r.emotion,
    risk_level: r.riskLevel,
    confidence: r.confidenceScore != null ? Math.round(r.confidenceScore * 100) : null,
  }));
}

async function searchRecords(userId: string, keyword: string, limit?: number) {
  if (!keyword.trim()) return [];
  const rows = await db.query.records.findMany({
    // ilike binds `keyword` as a parameter — safe from injection.
    where: and(eq(records.userId, userId), ilike(records.text, `%${keyword}%`)),
    orderBy: [desc(records.createdAt)],
    limit: clampLimit(limit),
    columns: { text: true, summary: true, sentiment: true, riskLevel: true },
  });
  return rows.map((r) => ({
    text: r.text.slice(0, 300),
    summary: r.summary,
    sentiment: r.sentiment,
    risk_level: r.riskLevel,
  }));
}

async function countRecords(userId: string, datasetId?: string) {
  const rows = await db
    .select({ cnt: count() })
    .from(records)
    .where(recordScope(userId, datasetId));
  return { count: Number(rows[0]?.cnt ?? 0) };
}

async function listDatasets(userId: string) {
  const rows = await db.query.datasets.findMany({
    where: eq(datasets.userId, userId),
    orderBy: [desc(datasets.createdAt)],
    limit: MAX_ROWS,
    columns: { id: true, originalFilename: true, rowCount: true, status: true },
  });
  return rows.map((d) => ({
    id: d.id,
    filename: d.originalFilename,
    row_count: d.rowCount,
    status: d.status,
  }));
}

type ToolArgs = Record<string, unknown>;

async function dispatchTool(name: string, args: ToolArgs, userId: string): Promise<unknown> {
  const datasetId = typeof args.datasetId === 'string' ? args.datasetId : undefined;
  try {
    switch (name) {
      case 'list_datasets':
        return await listDatasets(userId);
      case 'count_records':
        return await countRecords(userId, datasetId);
      case 'get_sentiment_breakdown':
        return await getBreakdown('sentiment', userId, datasetId);
      case 'get_risk_breakdown':
        return await getBreakdown('riskLevel', userId, datasetId);
      case 'get_emotion_breakdown':
        return await getBreakdown('emotion', userId, datasetId);
      case 'get_top_records':
        return await getTopRecords(userId, {
          orderBy: typeof args.orderBy === 'string' ? args.orderBy : undefined,
          sentiment: typeof args.sentiment === 'string' ? args.sentiment : undefined,
          limit: typeof args.limit === 'number' ? args.limit : undefined,
        });
      case 'search_records':
        return await searchRecords(
          userId,
          String(args.keyword ?? ''),
          typeof args.limit === 'number' ? args.limit : undefined,
        );
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    if (isTableMissingError(err)) {
      return {
        empty: true,
        note: 'No data yet — the user must upload and process a dataset first.',
      };
    }
    throw err;
  }
}

const TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'list_datasets',
        description: "List the user's uploaded datasets (id, filename, row count, status).",
        parameters: { type: 'OBJECT', properties: {} },
      },
      {
        name: 'count_records',
        description: 'Count the analyzed records. Optionally scope to a single datasetId.',
        parameters: {
          type: 'OBJECT',
          properties: { datasetId: { type: 'STRING', description: 'Optional dataset id' } },
        },
      },
      {
        name: 'get_sentiment_breakdown',
        description: 'Record counts grouped by sentiment (Positive/Neutral/Negative). Optional datasetId.',
        parameters: { type: 'OBJECT', properties: { datasetId: { type: 'STRING' } } },
      },
      {
        name: 'get_risk_breakdown',
        description: 'Record counts grouped by risk level (Low/Medium/High). Optional datasetId.',
        parameters: { type: 'OBJECT', properties: { datasetId: { type: 'STRING' } } },
      },
      {
        name: 'get_emotion_breakdown',
        description: 'Record counts grouped by detected emotion. Optional datasetId.',
        parameters: { type: 'OBJECT', properties: { datasetId: { type: 'STRING' } } },
      },
      {
        name: 'get_top_records',
        description:
          'Fetch up to 20 records. orderBy "risk" returns highest-risk first; "recent" returns newest first. Optional sentiment filter.',
        parameters: {
          type: 'OBJECT',
          properties: {
            orderBy: { type: 'STRING', enum: ['risk', 'recent'] },
            sentiment: { type: 'STRING', enum: ['Positive', 'Neutral', 'Negative'] },
            limit: { type: 'NUMBER', description: 'Max rows to return (1-20)' },
          },
        },
      },
      {
        name: 'search_records',
        description: 'Find up to 20 records whose text contains a keyword.',
        parameters: {
          type: 'OBJECT',
          properties: {
            keyword: { type: 'STRING' },
            limit: { type: 'NUMBER', description: 'Max rows to return (1-20)' },
          },
          required: ['keyword'],
        },
      },
    ],
  },
];

export async function runChat(
  messagesList: AgentMessage[],
  userId: string,
): Promise<[string, AgentLog[]]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY is required for the Nexus Agent.');

  const systemInstruction = `You are Nexus, a data analyst AI for Nexus AI. Answer questions about the user's data.

The data tools return ONLY the signed-in user's own records — scoping is enforced by the server, so you never need to ask for or supply a user id.

DATA MODEL:
- datasets: uploaded files (id, filename, row_count, status).
- records:  analyzed rows (text, summary, sentiment, emotion, risk_level, confidence).

RULES:
1. Always call a tool to get real numbers. Never fabricate data.
2. Never mention tools, SQL, or raw JSON in your answer — only the analysis.
3. If a tool reports no data (empty result), say: "No records found yet. Upload a CSV dataset and process it to see your data."
4. Be concise and direct. Use bullet points for lists.`;

  const contents: Array<{ role: string; parts: unknown[] }> = messagesList.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const logs: AgentLog[] = [];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_AGENT_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          tools: TOOL_DECLARATIONS,
          toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini agent error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const parts: Array<Record<string, unknown>> = data.candidates?.[0]?.content?.parts ?? [];
    const funcParts = parts.filter((p) => p.functionCall);

    if (funcParts.length > 0) {
      contents.push({ role: 'model', parts });
      const responseParts: unknown[] = [];
      for (const fp of funcParts) {
        const fc = fp.functionCall as { name: string; args?: ToolArgs };
        const args = fc.args ?? {};
        logs.push({ type: 'tool', content: `${fc.name}(${JSON.stringify(args)})` });
        const result = await dispatchTool(fc.name, args, userId);
        logs.push({ type: 'result', content: JSON.stringify(result).slice(0, 300) });
        responseParts.push({ functionResponse: { name: fc.name, response: { result } } });
      }
      contents.push({ role: 'user', parts: responseParts });
      continue;
    }

    const textPart = parts.find((p) => typeof p.text === 'string');
    const text = typeof textPart?.text === 'string' ? textPart.text.trim() : 'No response from agent.';
    return [text, logs];
  }

  return ['Could not generate a response. Please try again.', logs];
}
