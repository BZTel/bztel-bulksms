import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

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
