import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { records } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { and, eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Handles DELETE requests to remove multiple selected history entries.
 */
export async function DELETE(req: Request) {
  try {
    const userId = await requireAuth();
    const { record_ids } = await req.json();

    if (!record_ids || !Array.isArray(record_ids) || record_ids.length === 0) {
      return NextResponse.json({ detail: 'No record IDs provided.' }, { status: 400 });
    }

    await db.delete(records).where(
      and(
        eq(records.userId, userId),
        inArray(records.id, record_ids)
      )
    );

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
