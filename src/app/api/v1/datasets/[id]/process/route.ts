import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { datasets, records } from '@/lib/db/schema';
import { analyzeText, generateBatchInsights } from '@/lib/services/gemini';
import { authenticateRequest } from '@/lib/api/jwt';
import { eq, and } from 'drizzle-orm';

// Helper to parse CSV line respecting quotes
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

/**
 * Handles POST requests to kick off non-blocking, async Gemini processing
 * for all records inside the uploaded CSV dataset.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = authenticateRequest(req);
    const resolvedParams = await params;
    const datasetId = resolvedParams.id;
    const { text_column } = await req.json();

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

    // Set text column and mark status as processing
    await db.update(datasets)
      .set({
        status: 'processing',
        textColumn: text_column,
        processedCount: 0,
      })
      .where(eq(datasets.id, datasetId));

    // Async background promise - returns the HTTP response immediately
    (async () => {
      try {
        const filepath = path.join(process.cwd(), 'nexus-uploads', d.filename);

        if (!fs.existsSync(filepath)) {
          throw new Error('CSV upload file does not exist on disk.');
        }

        const content = fs.readFileSync(filepath, 'utf8');
        const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

        const headers = parseCsvLine(lines[0]);

        // Support multi-column selection: text_column may be "col1, col2"
        const columnNames = text_column.split(',').map((c: string) => c.trim()).filter(Boolean);
        const colIndices = columnNames.map((name: string) => headers.indexOf(name));

        if (colIndices.every((i: number) => i === -1)) {
          throw new Error(`None of the mapped columns were found in CSV headers: ${columnNames.join(', ')}`);
        }

        const maxRows = Math.min(lines.length - 1, 500);
        const texts: string[] = [];

        for (let i = 1; i <= maxRows; i++) {
          const rowValues = parseCsvLine(lines[i]);
          const rowText = colIndices
            .filter((i: number) => i !== -1)
            .map((i: number) => rowValues[i] || '')
            .filter(Boolean)
            .join(' | ');
          if (rowText.trim().length > 0) {
            texts.push(rowText);
          }
        }

        // Update rowCount to match processed rows in serverless context
        await db.update(datasets).set({ rowCount: texts.length }).where(eq(datasets.id, datasetId));

        let processed = 0;

        // Process rows in sequence
        for (const text of texts) {
          try {
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
          } catch (rowError) {
            console.error('Row analysis failed:', rowError);
          }

          processed++;
          await db.update(datasets)
            .set({ processedCount: processed })
            .where(eq(datasets.id, datasetId));
        }

        // Generate final batch insights
        const insights = await generateBatchInsights(texts);

        await db.update(datasets)
          .set({
            status: 'completed',
            insightsJson: JSON.stringify(insights),
          })
          .where(eq(datasets.id, datasetId));

      } catch (err: any) {
        console.error('Background batch processing error:', err);
        await db.update(datasets)
          .set({
            status: 'failed',
            errorMessage: err.message || 'Background process aborted.',
          })
          .where(eq(datasets.id, datasetId));
      }
    })();

    return NextResponse.json({ message: 'Batch intelligence processing initialized.' });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
