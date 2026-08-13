import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastMessage } from '@/lib/telemetry';

// Phase 1 rollout: warn (don't reject) on a missing/incorrect shared secret so DLR delivery
// updates keep flowing while Monty Mobile's webhook config is updated to include it. Once
// confirmed (via the warning no longer appearing in logs), flip this to fail-closed (401).
function checkDlrSecret(providedSecret: string | null) {
  const expected = process.env.DLR_WEBHOOK_SECRET;
  if (!expected || providedSecret !== expected) {
    console.error(
      `[SECURITY][DLR Webhook] Missing/invalid shared secret on inbound DLR request ` +
      `(env secret configured: ${!!expected}). Processing anyway during the rollout transition — ` +
      `this must be locked down (fail-closed) once Monty Mobile confirms sending the secret.`
    );
  }
}

// Helper to map Monty Mobile's StatusId to Bztel's SmsLog status
function mapMontyStatus(statusId: string | number | null | undefined): string {
  if (statusId === null || statusId === undefined) return 'failed';
  const id = Number(statusId);
  switch (id) {
    case 2:
      return 'delivered';
    case 6:
      return 'submitted'; // Accepted at carrier gateway
    case 3:
    case 4:
    case 5:
    case 7:
    case 8:
      return 'failed';
    default:
      return 'failed';
  }
}

async function processDlr(messageId: string | null, statusId: string | number | null) {
  if (!messageId) {
    console.warn('[DLR Webhook] Missing MessageId in DLR payload');
    return { error: 'Missing MessageId', status: 400 };
  }

  const status = mapMontyStatus(statusId);
  console.log(`[DLR Webhook] Processing DLR for MessageId: ${messageId} | StatusId: ${statusId} -> Status: ${status}`);

  try {
    // DLR message ID might be in decimal or hex. Look for both formats in the DB.
    let hexMsgId = '';
    let decMsgId = '';

    if (/^\d+$/.test(messageId)) {
      decMsgId = messageId;
      hexMsgId = parseInt(messageId, 10).toString(16);
    } else {
      hexMsgId = messageId.toLowerCase();
      try {
        decMsgId = parseInt(messageId, 16).toString(10);
      } catch (e) {}
    }

    // Find the SMS log associated with this provider's Message ID (supporting hex/decimal formats & case-insensitivity)
    const smsLog = await prisma.smsLog.findFirst({
      where: {
        OR: [
          { providerId: { equals: messageId, mode: 'insensitive' as const } },
          ...(hexMsgId ? [{ providerId: { equals: hexMsgId, mode: 'insensitive' as const } }] : []),
          ...(hexMsgId ? [{ providerId: { equals: hexMsgId.padStart(8, '0'), mode: 'insensitive' as const } }] : []),
          ...(decMsgId ? [{ providerId: { equals: decMsgId, mode: 'insensitive' as const } }] : [])
        ]
      }
    });

    if (!smsLog) {
      console.warn(`[DLR Webhook] No SMS log found matching providerId: ${messageId} (hex: ${hexMsgId}, dec: ${decMsgId})`);
      return { error: 'SMS log not found', status: 404 };
    }

    // Update log status in database
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: { status }
    });

    console.log(`[DLR Webhook] Successfully updated SMS Log ${smsLog.id} status to: ${status}`);

    // Broadcast update to telemetry clients
    broadcastMessage({
      type: 'SMS_UPDATED',
      timestamp: Date.now()
    });

    return { success: true };
  } catch (error) {
    console.error(`[DLR Webhook] Error updating SMS status in database:`, error);
    return { error: 'Database update failed', status: 500 };
  }
}

// Support GET requests
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('MessageId') || searchParams.get('messageId');
    const statusId = searchParams.get('StatusId') || searchParams.get('statusId');
    checkDlrSecret(searchParams.get('secret'));

    const result = await processDlr(messageId, statusId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Monty expects standard 200 OK with success indicator
    return NextResponse.json({ success: true, ErrorCode: 0, ErrorDescription: 'Ok' });
  } catch (error) {
    console.error('[DLR Webhook GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Support POST requests (nested CallBackResponse or flat JSON)
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let messageId: string | null = null;
    let statusId: string | number | null = null;
    let bodySecret: string | null = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      messageId = (formData.get('MessageId') as string) || (formData.get('messageId') as string);
      statusId = (formData.get('StatusId') as string) || (formData.get('statusId') as string);
      bodySecret = (formData.get('secret') as string) || (formData.get('Secret') as string);
    } else {
      const json = await req.json();

      // Support nested "CallBackResponse" from Section 2.2 of Monty guide
      if (json.CallBackResponse) {
        messageId = json.CallBackResponse.MessageId || json.CallBackResponse.messageId;
        statusId = json.CallBackResponse.StatusId || json.CallBackResponse.statusId;
      } else {
        // Flat JSON keys (flat format from Monty guide page 10)
        messageId = json.MessageId || json.messageId;
        statusId = json.StatusId || json.statusId;
      }
      bodySecret = json.secret || json.Secret || null;
    }

    // Carrier webhooks may only support appending a query param on the configured URL rather
    // than a custom body field — accept either.
    const { searchParams } = new URL(req.url);
    checkDlrSecret(searchParams.get('secret') || bodySecret);

    const result = await processDlr(messageId, statusId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Return the response Monty Mobile expects (ErrorCode 0, Ok)
    return NextResponse.json({ ErrorCode: 0, ErrorDescription: 'Ok' }, { status: 200 });
  } catch (error) {
    console.error('[DLR Webhook POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
