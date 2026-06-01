import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { alerts } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Handles DELETE requests to dismiss a single warning alert.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const alertId = resolvedParams.id;

    await db.delete(alerts).where(
      and(
        eq(alerts.id, alertId),
        eq(alerts.userId, userId)
      )
    );

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
