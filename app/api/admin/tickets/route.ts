import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET all support tickets (Admin only)
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      user_id: t.userId,
      email: t.user.email,
      subject: t.subject,
      priority: t.priority,
      description: t.description,
      status: t.status,
      created_at: t.createdAt,
    }));

    return NextResponse.json({ tickets: formattedTickets });
  } catch (error) {
    console.error('Admin fetch support tickets error:', error);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}
