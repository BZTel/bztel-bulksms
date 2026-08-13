import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, tickets, totalCount, activeCount, resolvedCount, highCount] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      // Platform-wide stats, independent of the current search/filter/page.
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: { in: ['Open', 'In Progress'] } } }),
      prisma.supportTicket.count({ where: { status: 'Resolved' } }),
      prisma.supportTicket.count({ where: { priority: 'high' } }),
    ]);

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

    return NextResponse.json({
      tickets: formattedTickets,
      stats: {
        total: totalCount,
        active: activeCount,
        resolved: resolvedCount,
        high: highCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Admin fetch support tickets error:', error);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}
