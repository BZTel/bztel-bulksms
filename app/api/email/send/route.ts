import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import nodemailer from 'nodemailer';

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

    const { recipients, subject, bodyHtml, senderName } = await req.json();
    const ownerId = authUser.owner_id;

    if (!recipients || !subject || !bodyHtml) {
      return NextResponse.json({ error: 'Recipients, Subject, and Body (HTML) are required' }, { status: 400 });
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

    const totalCreditsNeeded = recipientList.length; // 1 credit per email recipient

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

      // Fetch owner contacts for personalization mapping (replacing [Name] in bodyHtml)
      const contacts = await tx.contact.findMany({
        where: { userId: ownerId },
        select: { name: true, phone: true },
      });

      // Map contacts by their email if they have email, or phone. Let's just use contacts map by name if they match recipient email or we can search names. 
      // Since contacts model doesn't have an email field (only name, phone, groupName, birthdate), we can search by recipient email matching contact name or fallback to "Customer".
      // Wait, we can match by checking if the recipient email string is inside or matches. Usually, name mapping is done by phone in SMS, but for emails, we will fallback to "Customer" or we can search matching name if the recipient exists. Let's do a simple mapping or default to "Customer".

      // Deduct owner balance
      await tx.user.update({
        where: { id: ownerId },
        data: { balance: owner.balance - totalCreditsNeeded },
      });

      // Write Email Debit transaction log
      await tx.transaction.create({
        data: {
          userId: ownerId,
          type: 'email_debit',
          amount: -totalCreditsNeeded,
          balanceBefore: owner.balance,
          balanceAfter: owner.balance - totalCreditsNeeded,
          description: `Email Blast — ${recipientList.length} recipient${recipientList.length !== 1 ? 's' : ''} - "${subject}"`,
        },
      });

      // Bulk insert email logs
      const cleanSenderName = senderName ? senderName.trim() : 'BZTel';
      const cleanSenderEmail = process.env.SMTP_FROM || 'noreply@bztel.net';

      const bulkData = recipientList.map((recipient) => {
        const personalizedBody = bodyHtml.replace(/\[Name\]/gi, 'Customer');

        return {
          userId: ownerId,
          senderName: cleanSenderName,
          senderEmail: cleanSenderEmail,
          recipient: recipient.trim(),
          subject: subject.trim(),
          bodyHtml: personalizedBody,
          bodyText: personalizedBody.replace(/<[^>]*>/g, ''), // Basic html strip for plain text
          credits: 1,
          status: 'sent',
        };
      });

      await tx.emailLog.createMany({
        data: bulkData
      });
    });

    // Send emails asynchronously
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM || 'clientservice@bztel.net';

    if (!host || !user || !pass) {
      console.log(`[SMTP Mailer] SMTP not configured. Simulating Email Blast Dispatch:`);
      console.log(`----------------------------------------`);
      console.log(`From: "${senderName || 'BZTel'}" <${from}>`);
      console.log(`Subject: ${subject}`);
      console.log(`Recipients: ${recipientList.join(', ')}`);
      console.log(`Body (HTML length): ${bodyHtml.length} characters`);
      console.log(`----------------------------------------`);
    } else {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      recipientList.forEach((recipient) => {
        const personalizedBody = bodyHtml.replace(/\[Name\]/gi, 'Customer');
        transporter.sendMail({
          from: `"${senderName || 'BZTel'}" <${from}>`,
          to: recipient.trim(),
          subject: subject.trim(),
          html: personalizedBody
        }).catch(err => {
          console.error(`[SMTP Mailer] Failed to send email to ${recipient}:`, err);
        });
      });
    }

    return NextResponse.json({
      message: `Enqueued ${recipientList.length} emails. Credits deducted: ${totalCreditsNeeded}.`,
      batch_size: recipientList.length,
      credits_deducted: totalCreditsNeeded
    }, { status: 202 });

  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (error.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json({ error: 'Insufficient credits for sending email campaign' }, { status: 400 });
    }

    console.error('Send email error:', error);
    return NextResponse.json({ error: 'Failed to process email campaign' }, { status: 500 });
  }
}
