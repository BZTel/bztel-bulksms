import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerWorker } from '@/lib/queue';
import { checkContent, suspendUser } from '@/lib/safeguard';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const apiKey = authHeader && authHeader.split(' ')[1]; // Bearer bztel_live_xxx

    if (!apiKey) {
      return NextResponse.json({ error: 'API key missing in Authorization header' }, { status: 401 });
    }

    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      select: { userId: true },
    });

    if (!keyData) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 });
    }

    const ownerId = keyData.userId;

    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { status: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User associated with key not found' }, { status: 404 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Forbidden: Account is suspended.' }, { status: 403 });
    }

    const { senderId, recipients, message } = await req.json();

    if (!senderId || !recipients || !message) {
      return NextResponse.json({ error: 'Sender ID, Recipients, and Message are required' }, { status: 400 });
    }

    // Run security safeguard checks on sender ID and message content
    const checkResult = checkContent(senderId, message);
    if (checkResult.blocked) {
      console.warn(`[Security Alert] API SMS blocked for user ${ownerId}. Reason: ${checkResult.reason}`);
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

    const result = await prisma.$transaction(async (tx) => {
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

      // Deduct balance
      const updatedOwner = await tx.user.update({
        where: { id: ownerId },
        data: { balance: owner.balance - totalCreditsNeeded },
      });

      // Log transaction
      await tx.transaction.create({
        data: {
          userId: ownerId,
          type: 'sms_debit',
          amount: -totalCreditsNeeded,
          balanceBefore: owner.balance,
          balanceAfter: owner.balance - totalCreditsNeeded,
          description: `Public API SMS Broadcast — ${recipientList.length} recipients via ${cleanSenderId}`,
        },
      });

      const logPromises = recipientList.map((phone) =>
        tx.smsLog.create({
          data: {
            userId: ownerId,
            senderId: cleanSenderId,
            recipient: phone.trim(),
            message: rawMessage,
            credits: creditsPerMessage,
            status: 'pending',
          },
          select: { id: true }
        })
      );

      const createdLogs = await Promise.all(logPromises);

      return {
        remainingBalance: updatedOwner.balance,
        logIds: createdLogs.map((l) => l.id),
      };
    });

    // Trigger async worker queue processing
    triggerWorker();

    return NextResponse.json({
      success: true,
      message: `Enqueued ${recipientList.length} messages via API.`,
      credits_deducted: totalCreditsNeeded,
      remaining_balance: result.remainingBalance
    }, { status: 202 });

  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User associated with key not found' }, { status: 404 });
    }
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    console.error('Public API send SMS error:', error);
    return NextResponse.json({ error: 'Failed to process SMS request' }, { status: 500 });
  }
}
