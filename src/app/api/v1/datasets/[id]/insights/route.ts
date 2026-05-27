import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/api/jwt';
import { eq, and } from 'drizzle-orm';

/**
 * Handles GET requests to retrieve completed batch AI insights.
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

    if (!d.insightsJson) {
      return NextResponse.json({ detail: 'Insights not yet compiled.' }, { status: 400 });
    }

    return NextResponse.json(JSON.parse(d.insightsJson));
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
