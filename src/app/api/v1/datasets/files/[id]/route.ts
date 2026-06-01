import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
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
      return NextResponse.json({ detail: 'Dataset file not found locally.' }, { status: 404 });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
