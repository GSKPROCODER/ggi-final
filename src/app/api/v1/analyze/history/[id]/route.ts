import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { records } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Handles DELETE requests to clear an individual record from the history catalog.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const resolvedParams = await params;
    const recordId = resolvedParams.id;

    await db.delete(records).where(
      and(
        eq(records.id, recordId),
        eq(records.userId, userId)
      )
    );

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
