import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/api/jwt';

// Helper to parse a CSV line respecting quotes containing commas
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

/**
 * Handles POST requests to upload and structurally analyze a CSV dataset.
 */
export async function POST(req: Request) {
  try {
    const userId = authenticateRequest(req);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ detail: 'No file uploaded.' }, { status: 400 });
    }

    const originalFilename = file.name;
    const content = await file.text();

    // Parse CSV rows structurally
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      return NextResponse.json({ detail: 'Uploaded file is empty.' }, { status: 400 });
    }

    // Headers extraction
    const headers = parseCsvLine(lines[0]);
    const rowCount = lines.length - 1;

    // Generate first 10 sample rows
    const sampleRows: Array<Record<string, string>> = [];
    for (let i = 1; i <= Math.min(10, rowCount); i++) {
      const values = parseCsvLine(lines[i]);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      sampleRows.push(rowObj);
    }

    const datasetId = crypto.randomUUID();
    const serverFilename = `${datasetId}_${originalFilename}`;

    // Insert metadata to PostgreSQL
    await db.insert(datasets).values({
      id: datasetId,
      userId,
      filename: serverFilename,
      originalFilename,
      rowCount,
      columnsJson: JSON.stringify(headers),
      sampleRowsJson: JSON.stringify(sampleRows),
      status: 'pending',
    });

    // Write file context into temporary directory or keep in db schema. 
    // In Vercel serverless, we can store CSV row contents directly inside the memory store or
    // write to Vercel Blob. For local/development, we'll write the raw CSV text locally in a folder inside the workspace
    // as well as allow in-memory process triggers.
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'nexus-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    fs.writeFileSync(path.join(uploadDir, serverFilename), content, 'utf8');

    return NextResponse.json({
      id: datasetId,
      filename: serverFilename,
      original_filename: originalFilename,
      columns: headers,
      row_count: rowCount,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    const status = err.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status });
  }
}
