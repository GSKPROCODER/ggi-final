import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { parseCsvLine } from '@/lib/csv';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * Parse uploaded file content into headers and row objects.
 * Supports both CSV (text) and Excel (.xlsx) binary formats.
 */
async function parseFileContent(
  file: File
): Promise<{ headers: string[]; rowCount: number; sampleRows: Record<string, string>[]; rawCsvText: string }> {
  const filename = file.name.toLowerCase();

  if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const aoa: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (aoa.length === 0) {
      throw new Error('Uploaded Excel file is empty.');
    }

    const headers = aoa[0].map((h) => String(h).trim());
    const dataRows = aoa.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ''));
    const rowCount = dataRows.length;

    const sampleRows: Record<string, string>[] = [];
    for (let i = 0; i < Math.min(10, dataRows.length); i++) {
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = String(dataRows[i][idx] ?? '');
      });
      sampleRows.push(rowObj);
    }

    const rawCsvText = XLSX.utils.sheet_to_csv(sheet);
    return { headers, rowCount, sampleRows, rawCsvText };
  } else {
    const content = await file.text();
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('Uploaded CSV file is empty.');
    }

    const headers = parseCsvLine(lines[0]);
    const rowCount = lines.length - 1;

    const sampleRows: Record<string, string>[] = [];
    for (let i = 1; i <= Math.min(10, rowCount); i++) {
      const values = parseCsvLine(lines[i]);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      sampleRows.push(rowObj);
    }

    return { headers, rowCount, sampleRows, rawCsvText: content };
  }
}

/**
 * Handles POST requests to upload and structurally analyze a CSV or Excel dataset.
 * Files are stored in Vercel Blob for persistence across serverless invocations.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ detail: 'No file uploaded.' }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ detail: 'File must be 50 MB or less.' }, { status: 400 });
    }

    const originalFilename = file.name;
    const { headers, rowCount, sampleRows, rawCsvText } = await parseFileContent(file);

    const datasetId = crypto.randomUUID();
    let fileUrl = '';

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const serverFilename = `datasets/${datasetId}_${originalFilename.replace(/\.xlsx?$/i, '.csv')}`;
      const blob = await put(serverFilename, rawCsvText, { access: 'public' });
      fileUrl = blob.url;
    } else {
      // Local file fallback
      const uploadDir = path.join(process.cwd(), 'nexus-uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, `${datasetId}.csv`), rawCsvText, 'utf-8');

      const host = req.headers.get('host') ?? 'localhost:3000';
      const protocol = req.headers.get('x-forwarded-proto') ?? 'http';
      fileUrl = `${protocol}://${host}/api/v1/datasets/files/${datasetId}`;
    }

    await db.insert(datasets).values({
      id: datasetId,
      userId,
      filename: fileUrl,
      originalFilename,
      rowCount,
      columnsJson: JSON.stringify(headers),
      sampleRowsJson: JSON.stringify(sampleRows),
      status: 'pending',
    });

    return NextResponse.json({
      id: datasetId,
      filename: fileUrl,
      original_filename: originalFilename,
      columns: headers,
      row_count: rowCount,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
