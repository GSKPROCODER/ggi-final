import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { requireAuth } from '@/lib/api/auth';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ detail: 'Dataset ID is required.' }, { status: 400 });
    }

    // Verify the dataset belongs to the authenticated user (IDOR protection)
    const row = await db.query.datasets.findFirst({
      where: and(eq(datasets.id, id), eq(datasets.userId, userId)),
    });
    if (!row) {
      return NextResponse.json({ detail: 'Not found.' }, { status: 404 });
    }

    const filePath = path.join(os.tmpdir(), 'nexus-uploads', `${id}.csv`);
    try {
      const csvText = await fs.readFile(filePath, 'utf-8');
      return new NextResponse(csvText, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${id}.csv"`,
        },
      });
    } catch {
      return NextResponse.json({ detail: 'Dataset file not found locally.' }, { status: 404 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
