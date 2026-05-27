import { NextResponse } from 'next/server';
import { analyzeText } from '@/lib/services/gemini';
import { requireAuth } from '@/lib/api/auth';

/**
 * Handles POST requests to analyze an array of texts.
 */
export async function POST(req: Request) {
  try {
    await requireAuth();
    const { texts } = await req.json();

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json({ detail: 'Texts array is required.' }, { status: 400 });
    }

    const sample = texts.slice(0, 10); // Limit concurrent single calls to 10 for safety

    // Execute concurrent single analyses
    const results = await Promise.all(
      sample.map(async (t) => {
        try {
          return await analyzeText(t);
        } catch {
          return {
            summary: 'Error running analysis.',
            sentiment: 'Neutral' as const,
            emotion: 'Neutral',
            key_issues: [],
            risk_level: 'Low' as const,
            recommendations: [],
            confidence_score: 50,
          };
        }
      })
    );

    // Compute aggregates
    const total = results.length;
    let totalConfidence = 0;
    const sentimentCounts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    const riskCounts: Record<string, number> = { Low: 0, Medium: 0, High: 0 };

    results.forEach((r) => {
      totalConfidence += r.confidence_score;
      sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
      riskCounts[r.risk_level] = (riskCounts[r.risk_level] || 0) + 1;
    });

    let dominantRisk = 'Low';
    if (riskCounts.High > riskCounts.Medium && riskCounts.High > riskCounts.Low) dominantRisk = 'High';
    else if (riskCounts.Medium > riskCounts.Low) dominantRisk = 'Medium';

    return NextResponse.json({
      results,
      aggregate: total > 0 ? {
        total,
        sentiment_distribution: sentimentCounts,
        avg_confidence: parseFloat((totalConfidence / total).toFixed(2)),
        dominant_risk: dominantRisk,
      } : null,
    });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
