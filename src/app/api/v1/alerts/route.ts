import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Handles GET requests to retrieve anomaly alerts.
 */
export async function GET(req: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    const conditions = [eq(alerts.userId, userId)];

    if (severity) {
      conditions.push(eq(alerts.severity, severity));
    }

    if (unreadOnly) {
      conditions.push(eq(alerts.isRead, false));
    }

    const list = await db.query.alerts.findMany({
      where: and(...conditions),
      orderBy: [desc(alerts.createdAt)],
    });

    return NextResponse.json(
      list.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.message,
        severity: a.severity,
        is_read: a.isRead,
        created_at: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * Handles DELETE requests to clear all active alerts from the dashboard view.
 */
export async function DELETE(req: Request) {
  try {
    const userId = await requireAuth();

    await db.delete(alerts).where(eq(alerts.userId, userId));

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
