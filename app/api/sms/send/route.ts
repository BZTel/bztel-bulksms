import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { triggerWorker } from '@/lib/queue';
import { checkContent, suspendUser } from '@/lib/safeguard';
import { normalizeRecipientsList, normalizePhoneNumber } from '@/lib/phone';
import { randomUUID } from 'crypto';
import { smsSendRateLimiter } from '@/lib/rate-limit';

const ALLOWED_ROLES = ['Owner', 'Administrator', 'Dispatcher', 'Marketing Agent'];
const MAX_BATCH_SIZE = 10000;

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

    // Rate Limit Check (20 send requests per minute per owner)
    const rateLimit = await smsSendRateLimiter(String(authUser.owner_id));
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Too many SMS dispatch calls. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const senderId = body.senderId || body.sender;
    const { recipients, message } = body;
    const ownerId = authUser.owner_id;

    if (!senderId || !recipients || !message) {
      return NextResponse.json({ error: 'Sender ID, Recipients, and Message are required' }, { status: 400 });
    }

    // Run security safeguard checks on sender ID and message content
    const checkResult = await checkContent(senderId, message);
    if (checkResult.blocked) {
      console.warn(`[Security Alert] SMS blocked for user ${ownerId}. Reason: ${checkResult.reason}`);
      await suspendUser(ownerId, senderId, message);
      return NextResponse.json({ 
        error: 'Forbidden: Security policy violation detected. Your account has been suspended.' 
      }, { status: 403 });
    }

    const cleanSenderId = senderId.trim().substring(0, 11).toUpperCase();
    const rawMessage = message.trim();

    // Check if it's an approved Sender ID or assigned virtual number (used for Transactional routing)
    const virtualNum = await prisma.virtualNumber.findFirst({
      where: { userId: ownerId, number: senderId.trim() }
    });

    const approvedCustom = await prisma.senderId.findFirst({
      where: { userId: ownerId, name: cleanSenderId, status: 'approved' }
    });

    const isVerifiedTx = Boolean(virtualNum || approvedCustom);

    const parsedRecipients = normalizeRecipientsList(recipients);
    const recipientList = parsedRecipients.valid;

    if (recipientList.length === 0) {
      return NextResponse.json({ 
        error: 'Recipients list is empty or contains no valid phone numbers.',
        invalid_recipients: parsedRecipients.invalid
      }, { status: 400 });
    }

    const creditsPerMessage = Math.max(1, Math.ceil(rawMessage.length / 160));
    const totalCreditsNeeded = creditsPerMessage * recipientList.length;
    const batchId = randomUUID();

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

      const contactsMap = new Map(contacts.map(c => [normalizePhoneNumber(c.phone).normalized, c.name]));

      // Enforce Contact Check for Personalization [Name]
      const hasNameTag = /\[Name\]/gi.test(rawMessage);
      if (hasNameTag) {
        const missingNumbers = recipientList.filter(phone => !contactsMap.has(phone));
        if (missingNumbers.length > 0) {
          const err = new Error('MISSING_PERSONALIZATION_CONTACTS');
          (err as any).missingNumbers = missingNumbers;
          throw err;
        }
      }

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

      // Bulk insert outbox messages with normalized E.164 phone numbers
      const bulkData = recipientList.map((e164Phone) => {
        const contactName = contactsMap.get(e164Phone) || '';
        const personalizedMsg = rawMessage.replace(/\[Name\]/gi, contactName.trim());

        return {
          userId: ownerId,
          senderId: cleanSenderId,
          recipient: e164Phone,
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
      batch_id: batchId,
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
    if (error.message === 'MISSING_PERSONALIZATION_CONTACTS') {
      const missing = error.missingNumbers || [];
      return NextResponse.json({ 
        error: `Personalization Error: ${missing.length} recipient number(s) (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}) were not found in your Contacts Directory. Please save them to your Contacts Directory first or remove [Name] to proceed.`,
        missing_contacts: missing
      }, { status: 400 });
    }

    console.error('Send SMS error:', error);
    return NextResponse.json({ error: 'Failed to process bulk SMS' }, { status: 500 });
  }
}
