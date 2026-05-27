import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { alerts, records } from '@/lib/db/schema';
import { scanForAnomalies } from '@/lib/services/gemini';
import { authenticateRequest } from '@/lib/api/jwt';

/**
 * Handles POST requests to scan user records history for structural risk patterns
 * using Gemini. Creates and stores found anomalies as alert entries.
 */
export async function POST(req: Request) {
  try {
    const userId = authenticateRequest(req);

    // Fetch user's recent records to construct context
    const userRecords = await db.query.records.findMany({
      where: eq(records.userId, userId),
      limit: 50,
    });

    if (userRecords.length === 0) {
      return NextResponse.json([]); // No data to scan
    }

    const contextData = {
      records: userRecords.map(r => ({
        text: r.text.slice(0, 300),
        sentiment: r.sentiment,
        emotion: r.emotion,
        risk_level: r.riskLevel,
      })),
    };

    // Run anomaly scan via Gemini
    const scannedAlerts = await scanForAnomalies(contextData);

    const insertedAlerts = [];

    // Save found alerts
    for (const a of scannedAlerts) {
      const alertId = crypto.randomUUID();
      await db.insert(alerts).values({
        id: alertId,
        userId,
        title: a.title,
        message: a.message,
        severity: a.severity || 'low',
      });

      insertedAlerts.push({
        id: alertId,
        title: a.title,
        message: a.message,
        severity: a.severity || 'low',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(insertedAlerts);
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
