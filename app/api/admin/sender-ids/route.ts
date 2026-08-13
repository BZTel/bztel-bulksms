import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// GET all Sender ID requests (Admin only)
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

    const where: Prisma.SenderIdWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, senderIds, statusCounts] = await Promise.all([
      prisma.senderId.count({ where }),
      prisma.senderId.findMany({
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
      // Platform-wide status breakdown, independent of the current search/filter/page.
      prisma.senderId.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const formattedList = senderIds.map(s => ({
      id: s.id,
      user_id: s.userId,
      email: s.user.email,
      name: s.name,
      description: s.description,
      status: s.status,
      rejection_reason: s.rejectionReason,
      document_url: s.documentUrl,
      created_at: s.createdAt
    }));

    const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    for (const c of statusCounts) {
      const count = c._count._all || 0;
      stats.total += count;
      if (c.status === 'pending') stats.pending = count;
      if (c.status === 'approved') stats.approved = count;
      if (c.status === 'rejected') stats.rejected = count;
    }

    return NextResponse.json({
      sender_ids: formattedList,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Admin fetch sender-ids error:', error);
    return NextResponse.json({ error: 'Failed to fetch Sender ID requests' }, { status: 500 });
  }
}
