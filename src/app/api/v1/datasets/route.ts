import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Handles GET requests to retrieve a list of all uploaded datasets.
 */
export async function GET(req: Request) {
  try {
    const userId = await requireAuth();

    const list = await db.query.datasets.findMany({
      where: eq(datasets.userId, userId),
      orderBy: [desc(datasets.createdAt)],
      limit: 100,
    });

    return NextResponse.json(
      list.map((d) => ({
        id: d.id,
        original_filename: d.originalFilename,
        row_count: d.rowCount,
        status: d.status,
        text_column: d.textColumn,
        created_at: d.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    return handleApiError(err);
  }
}
