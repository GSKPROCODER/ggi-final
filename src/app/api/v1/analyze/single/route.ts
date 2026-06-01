import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { records } from '@/lib/db/schema';
import { analyzeText } from '@/lib/services/gemini';
import { requireAuth } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

/**
 * Handles POST requests to analyze a single text string using Gemini.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const { text, save_to_history = true } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ detail: 'Valid text parameter is required.' }, { status: 400 });
    }
    if (text.length > 10_000) {
      return NextResponse.json({ detail: 'Text must be 10,000 characters or fewer.' }, { status: 400 });
    }

    // Call Gemini analysis service
    const analysis = await analyzeText(text);

    let recordId = crypto.randomUUID();
    
    if (save_to_history) {
      await db.insert(records).values({
        id: recordId,
        userId,
        text,
        summary: analysis.summary,
        sentiment: analysis.sentiment,
        emotion: analysis.emotion,
        riskLevel: analysis.risk_level,
        confidenceScore: parseFloat((analysis.confidence_score / 100).toFixed(4)),
        keyIssuesJson: JSON.stringify(analysis.key_issues),
        recommendationsJson: JSON.stringify(analysis.recommendations),
      });
    }

    return NextResponse.json({
      id: recordId,
      text,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      emotion: analysis.emotion,
      risk_level: analysis.risk_level,
      confidence_score: analysis.confidence_score,
      key_issues: analysis.key_issues,
      recommendations: analysis.recommendations,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
