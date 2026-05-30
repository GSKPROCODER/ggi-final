import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/api/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface StatusEvent {
  id: string;
  status: string;
  processed_count: number;
  row_count: number;
  percent: number;
  error_message?: string;
}

/**
 * Server-Sent Events endpoint that streams dataset processing status.
 * Replaces client-side polling — the server tails the DB on a 1.5s tick
 * and pushes deltas only when something changes.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id: datasetId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let lastSignature = '';

      const send = (data: StatusEvent | { type: string }) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const heartbeat = () => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          closed = true;
        }
      };

      req.signal.addEventListener('abort', () => {
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      });

      const tick = async () => {
        if (closed) return;

        const d = await db.query.datasets.findFirst({
          where: and(eq(datasets.id, datasetId), eq(datasets.userId, userId)),
        });

        if (!d) {
          send({ type: 'not_found' });
          closed = true;
          try { controller.close(); } catch { /* */ }
          return;
        }

        const rowCount = d.rowCount || 1;
        const percent = Math.min(100, Math.round((d.processedCount / rowCount) * 100));
        const payload: StatusEvent = {
          id: d.id,
          status: d.status,
          processed_count: d.processedCount,
          row_count: d.rowCount,
          percent,
          ...(d.errorMessage ? { error_message: d.errorMessage } : {}),
        };
        const signature = `${payload.status}|${payload.processed_count}|${payload.percent}|${payload.error_message ?? ''}`;

        if (signature !== lastSignature) {
          send(payload);
          lastSignature = signature;
        }

        if (payload.status === 'completed' || payload.status === 'failed') {
          closed = true;
          try { controller.close(); } catch { /* */ }
          return;
        }
      };

      // Initial snapshot
      await tick();

      const interval = setInterval(tick, 1500);
      const keepalive = setInterval(heartbeat, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(keepalive);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
