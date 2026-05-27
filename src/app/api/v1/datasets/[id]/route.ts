import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { datasets, records } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/api/jwt';
import { eq, and } from 'drizzle-orm';

/**
 * Handles GET requests to retrieve detailed dataset parameters.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = authenticateRequest(req);
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
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
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
    const userId = authenticateRequest(req);
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

    // Delete local upload file if exists
    try {
      const fs = require('fs');
      const path = require('path');
      const filepath = path.join(process.cwd(), 'nexus-uploads', d.filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch { /* file already cleared or skipped */ }

    return new Response(null, { status: 204 });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
