import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/api/jwt';
import { eq, desc } from 'drizzle-orm';

/**
 * Handles GET requests to retrieve a list of all uploaded datasets.
 */
export async function GET(req: Request) {
  try {
    const userId = authenticateRequest(req);

    const list = await db.query.datasets.findMany({
      where: eq(datasets.userId, userId),
      orderBy: [desc(datasets.createdAt)],
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
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
