import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { registerClient, unregisterClient } from '@/lib/telemetry';

export async function GET(req: Request) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = Math.random().toString(36).substring(2);

  const stream = new ReadableStream({
    start(controller) {
      registerClient(clientId, controller, authUser.owner_id);

      // Connection confirmation keep-alive
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`));
    },
    cancel() {
      unregisterClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
