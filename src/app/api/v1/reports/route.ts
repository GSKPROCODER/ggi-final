import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports, records } from '@/lib/db/schema';
import { generateReport } from '@/lib/services/gemini';
import { requireAuth } from '@/lib/api/auth';
import { eq, desc } from 'drizzle-orm';

/**
 * Handles GET requests to retrieve user report records.
 */
export async function GET(req: Request) {
  try {
    const userId = await requireAuth();

    const list = await db.query.reports.findMany({
      where: eq(reports.userId, userId),
      orderBy: [desc(reports.createdAt)],
    });

    return NextResponse.json(
      list.map((r) => ({
        id: r.id,
        title: r.title,
        overview: r.overview,
        created_at: r.createdAt.toISOString(),
      }))
    );
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}

/**
 * Handles POST requests to generate a formal executive summary and analytical report.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const { title } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ detail: 'Report title is required.' }, { status: 400 });
    }

    // Pull recent records history for analysis context
    const userRecords = await db.query.records.findMany({
      where: eq(records.userId, userId),
      limit: 100,
    });

    if (userRecords.length === 0) {
      return NextResponse.json({ detail: 'No history records found. Import data to compile reports.' }, { status: 400 });
    }

    const contextData = {
      records: userRecords.map(r => ({
        text: r.text.slice(0, 200),
        sentiment: r.sentiment,
        emotion: r.emotion,
        risk_level: r.riskLevel,
      })),
    };

    // Run report generator via Gemini
    const reportAI = await generateReport(title, contextData);

    const reportId = crypto.randomUUID();

    // Save report in database
    await db.insert(reports).values({
      id: reportId,
      userId,
      title,
      overview: reportAI.overview,
      trendAnalysis: reportAI.trend_analysis,
      riskAssessment: reportAI.risk_assessment,
      keyFindingsJson: JSON.stringify(reportAI.key_findings),
      recommendationsJson: JSON.stringify(reportAI.recommendations),
      metricsJson: JSON.stringify(reportAI.metrics),
    });

    return NextResponse.json({
      id: reportId,
      title,
      overview: reportAI.overview,
      trend_analysis: reportAI.trend_analysis,
      risk_assessment: reportAI.risk_assessment,
      key_findings: reportAI.key_findings,
      recommendations: reportAI.recommendations,
      metrics: reportAI.metrics,
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
