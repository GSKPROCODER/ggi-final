import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ detail: 'Dataset ID is required.' }, { status: 400 });
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
      // Disk file gone (cross-invocation on Vercel) — fall back to DB inline storage
      const row = await db.query.datasets.findFirst({ where: eq(datasets.id, id) });
      if (row?.rawCsvText) {
        return new NextResponse(row.rawCsvText, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${id}.csv"`,
          },
        });
      }
      return NextResponse.json({ detail: 'Dataset file not found.' }, { status: 404 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
