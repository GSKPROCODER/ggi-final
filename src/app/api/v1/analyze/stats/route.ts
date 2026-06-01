import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { records } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, avg, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();

    const [totalRow, confRow, sentimentRows, riskRows, emotionRows] = await Promise.all([
      db.select({ total: count() }).from(records).where(eq(records.userId, userId)),
      db.select({ avg: avg(records.confidenceScore) }).from(records).where(eq(records.userId, userId)),
      db.select({ sentiment: records.sentiment, cnt: count() })
        .from(records).where(eq(records.userId, userId)).groupBy(records.sentiment),
      db.select({ risk: records.riskLevel, cnt: count() })
        .from(records).where(eq(records.userId, userId)).groupBy(records.riskLevel),
      db.select({ emotion: records.emotion, cnt: count() })
        .from(records).where(eq(records.userId, userId)).groupBy(records.emotion),
    ]);

    const total = Number(totalRow[0]?.total ?? 0);
    const avgConf = confRow[0]?.avg ? parseFloat(String(confRow[0].avg)) * 100 : 0;

    const sentimentDist: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    for (const row of sentimentRows) {
      if (row.sentiment) sentimentDist[row.sentiment] = Number(row.cnt);
    }

    const riskDist: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
    for (const row of riskRows) {
      if (row.risk) riskDist[row.risk] = Number(row.cnt);
    }

    const emotionDist: Record<string, number> = {};
    for (const row of emotionRows) {
      if (row.emotion) emotionDist[row.emotion] = Number(row.cnt);
    }

    return NextResponse.json({
      total_records: total,
      avg_confidence: parseFloat(avgConf.toFixed(2)),
      sentiment_distribution: sentimentDist,
      risk_distribution: riskDist,
      emotion_distribution: emotionDist,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
