import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/api/jwt';
import { eq, and } from 'drizzle-orm';

/**
 * Handles GET requests to retrieve report details.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = authenticateRequest(req);
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
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
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
    const userId = authenticateRequest(req);
    const resolvedParams = await params;
    const reportId = resolvedParams.id;

    await db.delete(reports).where(
      and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      )
    );

    return new Response(null, { status: 204 });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
