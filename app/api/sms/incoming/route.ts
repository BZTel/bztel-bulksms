import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const incomingMessages = await prisma.incomingMessage.findMany({
      where: { userId: ownerId },
      orderBy: { receivedAt: 'desc' },
      take: 100
    });

    const legacyIncoming = incomingMessages.map(msg => ({
      id: msg.id,
      user_id: msg.userId,
      from: msg.from,
      to: msg.to,
      message: msg.message,
      provider_id: msg.providerId,
      received_at: msg.receivedAt
    }));

    return NextResponse.json({ incoming: legacyIncoming });
  } catch (error) {
    console.error('Fetch incoming SMS logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch incoming messages' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let from = '';
    let to = '';
    let message = '';
    let providerId = '';

    // Parse payload based on format (URL-encoded or JSON)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      from = (formData.get('From') as string) || '';
      to = (formData.get('To') as string) || '';
      message = (formData.get('Body') as string) || '';
      providerId = (formData.get('MessageSid') as string) || '';
    } else {
      const json = await req.json();
      from = json.from || json.From || '';
      to = json.to || json.To || '';
      message = json.message || json.Message || json.body || json.Body || json.content || '';
      providerId = json.id || json.messageId || json.MessageSid || '';
    }

    // Clean inputs
    from = from.trim();
    to = to.trim();
    message = message.trim();

    if (!from || !to || !message) {
      console.warn('[Incoming Webhook] Missing required fields:', { from, to, message });
      return NextResponse.json({ error: 'Missing required fields: from, to, and message are required' }, { status: 400 });
    }

    console.log('[Incoming Webhook] Received SMS payload:', { from, to, message, providerId });

    // Look up virtual number to find user mapping
    let virtualNumRecord = await prisma.virtualNumber.findFirst({
      where: { number: to }
    });

    // Fallback suffix match (handles formatting discrepancies like leading '+' or country codes)
    if (!virtualNumRecord) {
      const sanitizedTo = to.replace(/[^0-9]/g, '');
      const allNumbers = await prisma.virtualNumber.findMany();
      virtualNumRecord = allNumbers.find(vn => {
        const sanitizedVn = vn.number.replace(/[^0-9]/g, '');
        return sanitizedTo.endsWith(sanitizedVn) || sanitizedVn.endsWith(sanitizedTo);
      }) || null;
    }

    if (!virtualNumRecord) {
      console.warn(`[Incoming Webhook] Received message for unmapped number: ${to}`);
      return NextResponse.json({ error: 'Receiver number is not mapped to any active user account' }, { status: 404 });
    }

    // Insert incoming message log
    const incomingMsg = await prisma.incomingMessage.create({
      data: {
        userId: virtualNumRecord.userId,
        from,
        to,
        message,
        providerId
      }
    });

    console.log('[Incoming Webhook] Saved incoming message successfully. Log ID:', incomingMsg.id);

    return NextResponse.json({ success: true, messageId: incomingMsg.id }, { status: 200 });
  } catch (error) {
    console.error('[Incoming Webhook] Error processing incoming SMS:', error);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
