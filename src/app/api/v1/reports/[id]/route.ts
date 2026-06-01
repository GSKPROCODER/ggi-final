import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { reports } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Handles GET requests to retrieve report details.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const reportId = resolvedParams.id;

    const r = await db.query.reports.findFirst({
      where: and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      ),
    });

    if (!r) {
      return NextResponse.json({ detail: 'Report not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: r.id,
      title: r.title,
      overview: r.overview,
      trend_analysis: r.trendAnalysis,
      risk_assessment: r.riskAssessment,
      key_findings: JSON.parse(r.keyFindingsJson),
      recommendations: JSON.parse(r.recommendationsJson),
      metrics: JSON.parse(r.metricsJson),
      created_at: r.createdAt.toISOString(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Handles DELETE requests to remove a single report.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const reportId = resolvedParams.id;

    await db.delete(reports).where(
      and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      )
    );

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
