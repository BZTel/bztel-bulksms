import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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

    const { recipients, subject, bodyHtml, senderName } = await req.json();

    if (!recipients || !subject || !bodyHtml) {
      return NextResponse.json({ error: 'Recipients, Subject, and bodyHtml are required' }, { status: 400 });
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
          type: 'email_debit',
          amount: -totalCreditsNeeded,
          balanceBefore: owner.balance,
          balanceAfter: owner.balance - totalCreditsNeeded,
          description: `Public API Email Broadcast — ${recipientList.length} recipients - "${subject}"`,
        },
      });

      const cleanSenderName = senderName ? senderName.trim() : 'BZTel';
      const cleanSenderEmail = process.env.SMTP_FROM || 'noreply@bztel.net';

      // Insert Email logs
      const logPromises = recipientList.map((recipient) =>
        tx.emailLog.create({
          data: {
            userId: ownerId,
            senderName: cleanSenderName,
            senderEmail: cleanSenderEmail,
            recipient: recipient.trim(),
            subject: subject.trim(),
            bodyHtml: bodyHtml,
            bodyText: bodyHtml.replace(/<[^>]*>/g, ''),
            credits: 1,
            status: 'sent',
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

    // Send actual emails asynchronously using Nodemailer
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM || 'clientservice@bztel.net';

    if (!host || !user || !pass) {
      console.log(`[SMTP Mailer API] SMTP not configured. Simulating Developer Email API:`);
      console.log(`----------------------------------------`);
      console.log(`From: "${senderName || 'BZTel'}" <${from}>`);
      console.log(`Subject: ${subject}`);
      console.log(`Recipients: ${recipientList.join(', ')}`);
      console.log(`----------------------------------------`);
    } else {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      recipientList.forEach((recipient) => {
        transporter.sendMail({
          from: `"${senderName || 'BZTel'}" <${from}>`,
          to: recipient.trim(),
          subject: subject.trim(),
          html: bodyHtml
        }).catch(err => {
          console.error(`[SMTP Mailer API] Failed to send email to ${recipient}:`, err);
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: `Enqueued ${recipientList.length} emails via API.`,
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

    console.error('Public API send Email error:', error);
    return NextResponse.json({ error: 'Failed to process Email request' }, { status: 500 });
  }
}
