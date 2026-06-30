import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    // Find the SMS log associated with this provider's Message ID
    const smsLog = await prisma.smsLog.findFirst({
      where: { providerId: messageId }
    });

    if (!smsLog) {
      console.warn(`[DLR Webhook] No SMS log found matching providerId: ${messageId}`);
      return { error: 'SMS log not found', status: 404 };
    }

    // Update log status in database
    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: { status }
    });

    console.log(`[DLR Webhook] Successfully updated SMS Log ${smsLog.id} status to: ${status}`);
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

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      messageId = (formData.get('MessageId') as string) || (formData.get('messageId') as string);
      statusId = (formData.get('StatusId') as string) || (formData.get('statusId') as string);
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
    }

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
