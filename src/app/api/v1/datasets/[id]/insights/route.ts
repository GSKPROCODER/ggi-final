import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

/**
 * Handles GET requests to retrieve completed batch AI insights.
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

    if (!d.insightsJson) {
      return NextResponse.json({ detail: 'Insights not yet compiled.' }, { status: 400 });
    }

    return NextResponse.json(JSON.parse(d.insightsJson));
  } catch (err) {
    return handleApiError(err);
  }
}
