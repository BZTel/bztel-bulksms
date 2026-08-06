import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import nodemailer from 'nodemailer';

// GET tickets
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });

    // Map to snake_case structure compatible with original frontend
    const legacyTickets = tickets.map((t) => ({
      id: t.id,
      user_id: t.userId,
      subject: t.subject,
      priority: t.priority,
      description: t.description,
      status: t.status,
      created_at: t.createdAt,
    }));

    return NextResponse.json({ tickets: legacyTickets });
  } catch (error) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}

// POST create ticket
export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, priority, description } = await req.json();
    const ownerId = authUser.owner_id;

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and Description are required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: ownerId,
        subject: subject.trim(),
        priority: priority || 'medium',
        description: description.trim(),
        status: 'Open',
      },
    });

    // Send email notification to Bztel support inbox
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM || 'clientservice@bztel.net';

    if (host && user && pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass }
        } as any);

        await transporter.sendMail({
          from: `"Bztel Support System" <${from}>`,
          to: 'clientservice@bztel.net',
          subject: `[New Ticket - ${priority.toUpperCase()}] ${subject.trim()}`,
          html: `
            <h2>New Support Ticket Created</h2>
            <p><strong>From User Email:</strong> ${authUser.email} (User ID: ${ownerId})</p>
            <p><strong>Subject:</strong> ${subject.trim()}</p>
            <p><strong>Priority Level:</strong> ${priority.toUpperCase()}</p>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p><strong>Ticket Description:</strong></p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-family: sans-serif; font-size: 0.95rem; line-height: 1.5; color: #334155;">
              ${description.trim()}
            </div>
          `
        });
        console.log(`[Support Ticket SMTP] Notification sent successfully to clientservice@bztel.net`);
      } catch (err) {
        console.error('[Support Ticket SMTP] Error sending mail notification:', err);
      }
    } else {
      console.log('[Support Ticket SMTP] SMTP not configured. Support email notification skipped.');
    }

    return NextResponse.json({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.createdAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Failed to submit support ticket' }, { status: 500 });
  }
}
