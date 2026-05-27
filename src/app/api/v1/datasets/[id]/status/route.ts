import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/api/jwt';
import { eq, and } from 'drizzle-orm';

/**
 * Handles GET requests to fetch the live processing status of a dataset.
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

    const rowCount = d.rowCount || 1;
    const percent = Math.min(100, Math.round((d.processedCount / rowCount) * 100));

    return NextResponse.json({
      id: d.id,
      status: d.status,
      processed_count: d.processedCount,
      row_count: d.rowCount,
      percent,
      error_message: d.errorMessage || undefined,
    });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
