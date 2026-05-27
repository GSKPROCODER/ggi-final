import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { records } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/api/jwt';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Handles GET requests to compile statistics across all analyzed records.
 */
export async function GET(req: Request) {
  try {
    const userId = authenticateRequest(req);

    const allRecords = await db.query.records.findMany({
      where: eq(records.userId, userId),
    });

    const total = allRecords.length;
    let totalConfidence = 0;
    const sentimentCounts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    const riskCounts: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
    const emotionCounts: Record<string, number> = {};

    allRecords.forEach((r) => {
      totalConfidence += r.confidenceScore || 0.75;
      if (r.sentiment) sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
      if (r.riskLevel) riskCounts[r.riskLevel] = (riskCounts[r.riskLevel] || 0) + 1;
      if (r.emotion) emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
    });

    return NextResponse.json({
      total_records: total,
      avg_confidence: total > 0 ? parseFloat(((totalConfidence / total) * 100).toFixed(2)) : 0,
      sentiment_distribution: sentimentCounts,
      risk_distribution: riskCounts,
      emotion_distribution: emotionCounts,
    });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
