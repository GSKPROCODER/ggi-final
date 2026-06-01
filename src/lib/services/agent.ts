import { sql } from 'drizzle-orm';
import { db } from '../db';

const GEMINI_AGENT_MODEL = 'gemini-2.5-flash';

export type AgentMessage = { role: 'user' | 'assistant'; content: string };
export type AgentLog = { type: string; content: string };

async function queryDatabase(query: string, userId: string): Promise<string> {
  try {
    const uppercaseQuery = query.toUpperCase();
    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'RENAME'];

    if (forbidden.some((cmd) => uppercaseQuery.includes(cmd))) {
      return 'Error: Read-only access permitted.';
    }

    if (!query.includes(userId)) {
      return `Error: Query violates security sandbox. You MUST include \`user_id = '${userId}'\` in your WHERE clause.`;
    }

    let executableQuery = query;
    if (!uppercaseQuery.includes('LIMIT') && (uppercaseQuery.includes('SELECT *') || uppercaseQuery.includes('SELECT TEXT'))) {
      executableQuery += ' LIMIT 50';
    }

    const result = await db.execute(sql.raw(executableQuery));
    const rows = result.rows;

    if (!rows || rows.length === 0) {
      return 'EMPTY_RESULT: No rows returned. The user may have no data yet, or nothing matched the filter.';
    }

    return JSON.stringify(rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('relation') || msg.includes('does not exist') || msg.includes('42P01')) {
      return 'NO_TABLES: Database tables not set up yet. The user needs to upload and process a dataset first.';
    }
    return `SQL Error: ${msg}`;
  }
}

export async function runChat(
  messagesList: AgentMessage[],
  userId: string,
): Promise<[string, AgentLog[]]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY is required for the Nexus Agent.');

  const systemInstruction = `You are Nexus, a data analyst AI for Nexus AI. Answer questions about the user's data.

SECURITY: Every SQL query MUST include user_id = '${userId}' in the WHERE clause.

DATABASE SCHEMA:
- datasets: id, user_id, filename, original_filename, row_count, text_column, status, processed_count, created_at
- records:  id, user_id, dataset_id, text, summary, sentiment, emotion, risk_level, confidence_score, created_at
- reports:  id, user_id, title, overview, trend_analysis, risk_assessment, created_at
- alerts:   id, user_id, title, message, severity, is_read, created_at

RULES:
1. Always call query_database first. Never fabricate numbers.
2. Never show SQL queries or raw JSON in your response — only the analysis.
3. If the tool returns EMPTY_RESULT: say "No records found yet. Upload a CSV dataset and process it to see your data."
4. If the tool returns NO_TABLES: say "Your database isn't set up yet. Go to Upload Data, import a CSV, and run analysis first."
5. Be concise and direct. No padding or unnecessary headers.`;

  const tools = [{
    functionDeclarations: [{
      name: 'query_database',
      description: 'Execute a read-only SQL SELECT query on the user\'s database. Always include user_id in WHERE.',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: { type: 'STRING', description: 'SQL SELECT query with user_id in WHERE clause' },
        },
        required: ['query'],
      },
    }],
  }];

  const contents: Array<{ role: string; parts: unknown[] }> = messagesList.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const logs: AgentLog[] = [];

  for (let turn = 0; turn < 4; turn++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_AGENT_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          tools,
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

    const funcPart = parts.find((p) => p.functionCall);
    if (funcPart) {
      const fc = funcPart.functionCall as { name: string; args: { query: string } };
      logs.push({ type: 'query', content: fc.args.query });
      const result = await queryDatabase(fc.args.query, userId);
      logs.push({ type: 'result', content: result.slice(0, 300) });

      contents.push({ role: 'model', parts });
      contents.push({
        role: 'user',
        parts: [{ functionResponse: { name: fc.name, response: { result } } }],
      });
      continue;
    }

    const textPart = parts.find((p) => typeof p.text === 'string');
    const text = typeof textPart?.text === 'string' ? textPart.text.trim() : 'No response from agent.';
    return [text, logs];
  }

  return ['Could not generate a response. Please try again.', logs];
}
