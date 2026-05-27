import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

/**
 * Handles PATCH requests to mark a specific alert as read.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const alertId = resolvedParams.id;

    await db.update(alerts)
      .set({ isRead: true })
      .where(
        and(
          eq(alerts.id, alertId),
          eq(alerts.userId, userId)
        )
      );

    const updated = await db.query.alerts.findFirst({
      where: and(
        eq(alerts.id, alertId),
        eq(alerts.userId, userId)
      ),
    });

    if (!updated) {
      return NextResponse.json({ detail: 'Alert not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      message: updated.message,
      severity: updated.severity,
      is_read: updated.isRead,
      created_at: updated.createdAt.toISOString(),
    });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
