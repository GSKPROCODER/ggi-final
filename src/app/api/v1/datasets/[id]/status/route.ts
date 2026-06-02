import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Background processing runs in an `after()` callback that is not durable: if the
// serverless instance is recycled, a dataset can be left stuck in 'processing'
// forever. Any job still 'processing' past this window is treated as failed.
const STALE_PROCESSING_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Handles GET requests to fetch the live processing status of a dataset.
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

    let status = d.status;
    let errorMessage = d.errorMessage;

    // Watchdog: flip a stalled background job to 'failed' so the UI stops spinning.
    if (status === 'processing' && Date.now() - d.createdAt.getTime() > STALE_PROCESSING_MS) {
      status = 'failed';
      errorMessage = 'Processing timed out. Please try again.';
      await db.update(datasets)
        .set({ status, errorMessage })
        .where(eq(datasets.id, datasetId));
    }

    const rowCount = d.rowCount || 1;
    const percent = Math.min(100, Math.round((d.processedCount / rowCount) * 100));

    return NextResponse.json({
      id: d.id,
      status,
      processed_count: d.processedCount,
      row_count: d.rowCount,
      percent,
      error_message: errorMessage || undefined,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
