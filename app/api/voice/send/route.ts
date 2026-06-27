import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_ROLES = ['Owner', 'Administrator', 'Dispatcher'];

/**
 * Provider interface hook for Voice/TTS Gateway Integration
 */
async function dispatchVoiceToProvider(logIds: number[]) {
  // Real Voice Provider API (e.g., Twilio/SIP/Plivo) will be attached here upon integration.
  try {
    await prisma.$transaction(
      logIds.map((id) =>
        prisma.voiceLog.update({
          where: { id },
          data: { status: 'submitted' },
        })
      )
    );
  } catch (error) {
    console.error('Failed to update voice delivery status:', error);
  }
}

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

    const { senderId, recipients, ttsText, audioUrl } = await req.json();
    const ownerId = authUser.owner_id;

    if (!senderId || !recipients || (!ttsText && !audioUrl)) {
      return NextResponse.json({ 
        error: 'Sender ID, Recipients, and either TTS Text or Audio URL are required' 
      }, { status: 400 });
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

    const creditsPerCall = 2;
    const totalCreditsNeeded = creditsPerCall * recipientList.length;

    const cleanSenderId = senderId.trim().substring(0, 11).toUpperCase();

    // Enforce Sender ID Verification Checks
    const isDefaultSender = cleanSenderId === 'BZTEL';
    
    const virtualNum = await prisma.virtualNumber.findFirst({
      where: { userId: ownerId, number: senderId.trim() }
    });

    const approvedCustom = await prisma.senderId.findFirst({
      where: { userId: ownerId, name: cleanSenderId, status: 'approved' }
    });

    if (!isDefaultSender && !virtualNum && !approvedCustom) {
      return NextResponse.json({ 
        error: 'Forbidden: Sender ID is unverified, pending review, or not assigned to your account.' 
      }, { status: 403 });
    }

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
      await tx.user.update({
        where: { id: ownerId },
        data: { balance: owner.balance - totalCreditsNeeded },
      });

      // Write Transaction log
      await tx.transaction.create({
        data: {
          userId: ownerId,
          type: 'voice_debit',
          amount: -totalCreditsNeeded,
          balanceBefore: owner.balance,
          balanceAfter: owner.balance - totalCreditsNeeded,
          description: `Voice Broadcast — ${recipientList.length} call${recipientList.length !== 1 ? 's' : ''} via ${cleanSenderId}`,
        },
      });

      const voiceLogPromises = recipientList.map((phone) =>
        tx.voiceLog.create({
          data: {
            userId: ownerId,
            senderId: cleanSenderId,
            recipient: phone.trim(),
            ttsText: ttsText || null,
            audioUrl: audioUrl || null,
            duration: 30,
            credits: creditsPerCall,
            status: 'pending',
          },
          select: { id: true }
        })
      );

      const createdLogs = await Promise.all(voiceLogPromises);
      return createdLogs.map((l) => l.id);
    });

    await dispatchVoiceToProvider(result);

    return NextResponse.json({
      message: `Enqueued ${recipientList.length} voice call(s). Credits deducted: ${totalCreditsNeeded}.`,
      credits_deducted: totalCreditsNeeded
    }, { status: 202 });

  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json({ error: 'Insufficient credits for voice broadcast campaign' }, { status: 400 });
    }

    console.error('Voice send error:', error);
    return NextResponse.json({ error: 'Failed to process voice broadcast campaign' }, { status: 500 });
  }
}
