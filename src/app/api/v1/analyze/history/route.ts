import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { records } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and, ilike, desc } from 'drizzle-orm';

/**
 * Handles GET requests to list historical text intelligence records.
 */
export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sentiment = searchParams.get('sentiment');
    const search = searchParams.get('search');

    // Build conditional query filters
    const conditions = [eq(records.userId, userId)];

    if (sentiment) {
      conditions.push(eq(records.sentiment, sentiment));
    }

    if (search) {
      conditions.push(ilike(records.text, `%${search}%`));
    }

    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [history, allForCount] = await Promise.all([
      db.query.records.findMany({
        where: and(...conditions),
        orderBy: [desc(records.createdAt)],
        limit,
        offset,
      }),
      db.query.records.findMany({
        where: and(...conditions),
        columns: { id: true },
      }),
    ]);

    return NextResponse.json({
      items: history.map((r) => ({
        id: r.id,
        text: r.text,
        summary: r.summary,
        sentiment: r.sentiment,
        emotion: r.emotion,
        risk_level: r.riskLevel,
        confidence_score: r.confidenceScore ? r.confidenceScore * 100 : 75,
        key_issues: JSON.parse(r.keyIssuesJson || '[]'),
        recommendations: JSON.parse(r.recommendationsJson || '[]'),
        created_at: r.createdAt.toISOString(),
      })),
      total: allForCount.length,
      limit,
      offset,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
