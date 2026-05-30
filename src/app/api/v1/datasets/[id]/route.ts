import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { del } from '@vercel/blob';
import { db } from '@/lib/db';
import { datasets, records } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * Handles GET requests to retrieve detailed dataset parameters.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const datasetId = resolvedParams.id;

    const d = await db.query.datasets.findFirst({
      where: and(
        eq(datasets.id, datasetId),
        eq(datasets.userId, userId)
      ),
    });

    if (!d) {
      return NextResponse.json({ detail: 'Dataset not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: d.id,
      original_filename: d.originalFilename,
      row_count: d.rowCount,
      text_column: d.textColumn,
      columns: JSON.parse(d.columnsJson),
      sample_rows: JSON.parse(d.sampleRowsJson),
      status: d.status,
      processed_count: d.processedCount,
      insights: d.insightsJson ? JSON.parse(d.insightsJson) : null,
      created_at: d.createdAt.toISOString(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Handles DELETE requests to clear an uploaded dataset, its file on disk,
 * and all analyzed text logs tied to it.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const datasetId = resolvedParams.id;

    const d = await db.query.datasets.findFirst({
      where: and(
        eq(datasets.id, datasetId),
        eq(datasets.userId, userId)
      ),
    });

    if (!d) {
      return NextResponse.json({ detail: 'Dataset not found.' }, { status: 404 });
    }

    // Clear child records first (relational safety)
    await db.delete(records).where(eq(records.datasetId, datasetId));
    
    // Clear dataset meta
    await db.delete(datasets).where(eq(datasets.id, datasetId));

    // Delete file from Vercel Blob or local storage
    try {
      if (d.filename?.includes('/api/v1/datasets/files/')) {
        const filePath = path.join(process.cwd(), 'nexus-uploads', `${datasetId}.csv`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else if (d.filename?.startsWith('http')) {
        await del(d.filename);
      }
    } catch { /* blob or local file already deleted or not found */ }

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
