import { NextResponse, after } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { datasets, records } from '@/lib/db/schema';
import { analyzeText, generateBatchInsights } from '@/lib/services/ai';
import { requireAuth } from '@/lib/api/auth';
import { parseCsvLine } from '@/lib/csv';
import { eq, and } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

// Cap on rows analyzed per dataset. Kept modest because each row is an LLM call
// and the whole batch must finish inside the function's maxDuration. Surfaced in
// the upload UI so truncation is an explicit, communicated limit.
export const MAX_ANALYZE_ROWS = 500;

/**
 * Handles POST requests to kick off non-blocking Gemini batch processing.
 * Uses after() to keep the Vercel function alive after the HTTP response is sent.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const datasetId = resolvedParams.id;
    const { text_column, raw_csv_text: rawCsvFromBody } = await req.json();

    if (!text_column) {
      return NextResponse.json({ detail: 'Mapped text column is required.' }, { status: 400 });
    }

    const d = await db.query.datasets.findFirst({
      where: and(
        eq(datasets.id, datasetId),
        eq(datasets.userId, userId)
      ),
    });

    if (!d) {
      return NextResponse.json({ detail: 'Dataset not found.' }, { status: 404 });
    }

    await db.update(datasets)
      .set({ status: 'processing', textColumn: text_column, processedCount: 0 })
      .where(eq(datasets.id, datasetId));

    // after() keeps the Vercel function alive after the response is sent
    after(async () => {
      try {
        let content = '';

        // Priority: request body (cross-invocation safe) → Blob URL → local disk
        if (rawCsvFromBody) {
          content = rawCsvFromBody;
        } else if (d.filename?.includes('/api/v1/datasets/files/')) {
          const filePath = path.join(os.tmpdir(), 'nexus-uploads', `${datasetId}.csv`);
          content = await fs.readFile(filePath, 'utf-8');
        } else {
          const fileRes = await fetch(d.filename);
          if (!fileRes.ok) throw new Error('Could not retrieve uploaded file from storage.');
          content = await fileRes.text();
        }

        const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const headers = parseCsvLine(lines[0]);

        // Support multi-column: text_column may be "col1, col2"
        const columnNames = text_column.split(',').map((c: string) => c.trim()).filter(Boolean);
        const colIndices = columnNames.map((name: string) => headers.indexOf(name));

        if (colIndices.every((i: number) => i === -1)) {
          throw new Error(`None of the mapped columns were found in CSV headers: ${columnNames.join(', ')}`);
        }

        const maxRows = Math.min(lines.length - 1, MAX_ANALYZE_ROWS);
        const texts: string[] = [];

        for (let i = 1; i <= maxRows; i++) {
          const rowValues = parseCsvLine(lines[i]);
          const rowText = colIndices
            .filter((i: number) => i !== -1)
            .map((i: number) => rowValues[i] || '')
            .filter(Boolean)
            .join(' | ');
          if (rowText.trim().length > 0) texts.push(rowText);
        }

        await db.update(datasets).set({ rowCount: texts.length }).where(eq(datasets.id, datasetId));

        let processed = 0;
        const CONCURRENCY = 5;
        const UPDATE_EVERY = 10;

        for (let i = 0; i < texts.length; i += CONCURRENCY) {
          const batch = texts.slice(i, i + CONCURRENCY);
          const results = await Promise.allSettled(
            batch.map(async (text) => {
              const analysis = await analyzeText(text);
              await db.insert(records).values({
                id: crypto.randomUUID(),
                userId,
                datasetId,
                text,
                summary: analysis.summary,
                sentiment: analysis.sentiment,
                emotion: analysis.emotion,
                riskLevel: analysis.risk_level,
                confidenceScore: parseFloat((analysis.confidence_score / 100).toFixed(4)),
                keyIssuesJson: JSON.stringify(analysis.key_issues),
                recommendationsJson: JSON.stringify(analysis.recommendations),
              });
            })
          );
          for (const r of results) {
            if (r.status === 'rejected') console.error('Row analysis failed:', r.reason);
          }
          processed += results.filter((r) => r.status === 'fulfilled').length;

          // Batch DB progress updates — write every UPDATE_EVERY rows or at end
          if (processed % UPDATE_EVERY < CONCURRENCY || i + CONCURRENCY >= texts.length) {
            await db.update(datasets)
              .set({ processedCount: processed })
              .where(eq(datasets.id, datasetId));
          }
        }

        const insights = await generateBatchInsights(texts);
        await db.update(datasets)
          .set({ status: 'completed', insightsJson: JSON.stringify(insights) })
          .where(eq(datasets.id, datasetId));

      } catch (err) {
        console.error('Background batch processing error:', err);
        const message = err instanceof Error ? err.message : 'Background process aborted.';
        await db.update(datasets)
          .set({ status: 'failed', errorMessage: message })
          .where(eq(datasets.id, datasetId));
      }
    });

    return NextResponse.json({ message: 'Batch intelligence processing initialized.' });
  } catch (err) {
    return handleApiError(err);
  }
}
