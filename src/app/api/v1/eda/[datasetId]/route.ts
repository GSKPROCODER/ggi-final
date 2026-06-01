import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { datasets, records } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Handles GET requests to calculate Exploratory Data Analysis distributions
 * and statistical overview objects.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const datasetId = resolvedParams.datasetId;

    const d = await db.query.datasets.findFirst({
      where: and(
        eq(datasets.id, datasetId),
        eq(datasets.userId, userId)
      ),
    });

    if (!d) {
      return NextResponse.json({ detail: 'Dataset not found.' }, { status: 404 });
    }

    const dsRecords = await db.query.records.findMany({
      where: and(eq(records.datasetId, datasetId), eq(records.userId, userId)),
    });

    const totalRecords = d.rowCount || dsRecords.length || 0;
    
    // Calculate character length statistics
    let totalChars = 0;
    const lengthBins: Record<string, number> = {
      '0-50': 0,
      '51-150': 0,
      '151-300': 0,
      '300+': 0,
    };

    const sentimentCounts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    const riskCounts: Record<string, number> = { Low: 0, Medium: 0, High: 0 };

    dsRecords.forEach((r) => {
      const len = r.text.length;
      totalChars += len;

      if (len <= 50) lengthBins['0-50']++;
      else if (len <= 150) lengthBins['51-150']++;
      else if (len <= 300) lengthBins['151-300']++;
      else lengthBins['300+']++;

      if (r.sentiment) sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
      if (r.riskLevel) riskCounts[r.riskLevel] = (riskCounts[r.riskLevel] || 0) + 1;
    });

    // Divide by analyzed records, not raw row count — avoids showing 0 when processing hasn't run yet
    const avgChars = dsRecords.length > 0 ? Math.round(totalChars / dsRecords.length) : 0;
    const analyzedCount = dsRecords.length;
    const missingPct = totalRecords > 0 ? ((totalRecords - analyzedCount) / totalRecords) * 100 : 0;

    return NextResponse.json({
      overview: {
        total_records: totalRecords,
        avg_chars: `${avgChars} chars`,
        status: d.status === 'completed' ? 'processed' : d.status,
        missing_analysis_pct: Math.max(0, missingPct),
      },
      distributions: {
        sentiment: Object.keys(sentimentCounts).map((k) => ({
          name: k,
          value: sentimentCounts[k],
        })),
        risk: Object.keys(riskCounts).map((k) => ({
          name: k,
          value: riskCounts[k],
        })),
        length: Object.keys(lengthBins).map((k) => ({
          name: k,
          count: lengthBins[k],
        })),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
