import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { triggerWorker } from '@/lib/queue';
import { checkContent, suspendUser } from '@/lib/safeguard';
import { randomUUID } from 'crypto';

const ALLOWED_ROLES = ['Owner', 'Administrator', 'Dispatcher', 'Marketing Agent'];

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(authUser.role)) {
      return NextResponse.json({ 
        error: `Access denied. Insufficient role permissions. Allowed: ${ALLOWED_ROLES.join(', ')}` 
      }, { status: 403 });
    }

    const { senderId, recipients, message } = await req.json();
    const ownerId = authUser.owner_id;

    if (!senderId || !recipients || !message) {
      return NextResponse.json({ error: 'Sender ID, Recipients, and Message are required' }, { status: 400 });
    }

    // Run security safeguard checks on sender ID and message content
    const checkResult = checkContent(senderId, message);
    if (checkResult.blocked) {
      console.warn(`[Security Alert] SMS blocked for user ${ownerId}. Reason: ${checkResult.reason}`);
      await suspendUser(ownerId, senderId, message);
      return NextResponse.json({ 
        error: 'Forbidden: Security policy violation detected. Your account has been suspended.' 
      }, { status: 403 });
    }

    const cleanSenderId = senderId.trim().substring(0, 11).toUpperCase();
    const rawMessage = message.trim();

    // Enforce Sender ID Verification Checks
    const isDefaultSender = cleanSenderId === 'BZTEL';
    
    // Check if it matches a virtual number assigned to this user
    const virtualNum = await prisma.virtualNumber.findFirst({
      where: { userId: ownerId, number: senderId.trim() }
    });

    // Check if it's an approved custom Sender ID
    const approvedCustom = await prisma.senderId.findFirst({
      where: { userId: ownerId, name: cleanSenderId, status: 'approved' }
    });

    if (!isDefaultSender && !virtualNum && !approvedCustom) {
      return NextResponse.json({ 
        error: 'Forbidden: Sender ID is unverified, pending review, or not assigned to your account.' 
      }, { status: 403 });
    }

    let recipientList: string[] = [];
    if (Array.isArray(recipients)) {
      recipientList = recipients;
    } else if (typeof recipients === 'string') {
      recipientList = recipients.split(',').map(r => r.trim()).filter(Boolean);
    }

    if (recipientList.length === 0) {
      return NextResponse.json({ error: 'Recipients list is empty' }, { status: 400 });
    }

    const creditsPerMessage = Math.max(1, Math.ceil(rawMessage.length / 160));
    const totalCreditsNeeded = creditsPerMessage * recipientList.length;

    await prisma.$transaction(async (tx) => {
      // Check owner balance
      const owner = await tx.user.findUnique({
        where: { id: ownerId },
        select: { balance: true },
      });

      if (!owner) {
        throw new Error('USER_NOT_FOUND');
      }

      if (owner.balance < totalCreditsNeeded) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      // Fetch owner contacts for personalization mapping
      const contacts = await tx.contact.findMany({
        where: { userId: ownerId },
        select: { name: true, phone: true },
      });

      const contactsMap = new Map(contacts.map(c => [c.phone.replace(/[\s+()-]/g, ''), c.name]));

      // Deduct owner balance
      await tx.user.update({
        where: { id: ownerId },
        data: { balance: owner.balance - totalCreditsNeeded },
      });

      // Write SMS Debit transaction log
      await tx.transaction.create({
        data: {
          userId: ownerId,
          type: 'sms_debit',
          amount: -totalCreditsNeeded,
          balanceBefore: owner.balance,
          balanceAfter: owner.balance - totalCreditsNeeded,
          description: `SMS Batch — ${recipientList.length} recipient${recipientList.length !== 1 ? 's' : ''} via ${cleanSenderId}`,
        },
      });

      const batchId = randomUUID();

      // Bulk insert outbox messages
      const bulkData = recipientList.map((rawPhone) => {
        const cleanPhone = rawPhone.replace(/[\s+()-]/g, '');
        const contactName = contactsMap.get(cleanPhone) || 'Customer';
        const personalizedMsg = rawMessage.replace(/\[Name\]/gi, contactName);

        return {
          userId: ownerId,
          senderId: cleanSenderId,
          recipient: rawPhone.trim(),
          message: personalizedMsg,
          credits: creditsPerMessage,
          status: 'pending',
          batchId,
        };
      });

      await tx.smsLog.createMany({
        data: bulkData
      });
    });

    // Trigger async worker queue processing (decoupled background worker)
    triggerWorker();

    return NextResponse.json({
      message: `Enqueued ${recipientList.length} messages. Credits deducted: ${totalCreditsNeeded}.`,
      batch_size: recipientList.length,
      credits_deducted: totalCreditsNeeded
    }, { status: 202 });

  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json({ error: 'Insufficient credits for sending bulk SMS' }, { status: 400 });
    }

    console.error('Send SMS error:', error);
    return NextResponse.json({ error: 'Failed to process bulk SMS' }, { status: 500 });
  }
}
