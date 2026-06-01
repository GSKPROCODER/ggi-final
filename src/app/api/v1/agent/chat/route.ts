import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { runChat } from '@/lib/services/agent';
import { requireAuth } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

/**
 * Handles POST requests to run conversational database analytics.
 * Feeds chat messages directly into the DeepMind critic LangGraph state machine.
 */
export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ detail: 'Messages array is required.' }, { status: 400 });
    }

    const threadId = `thread_${userId}`;

    // Run the LangGraph execution flow
    const [finalMessage, logs] = await runChat(messages, userId, threadId);

    return NextResponse.json({
      message: finalMessage,
      thought_process: logs.map((l) => ({
        type: l.type,
        content: l.content,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
