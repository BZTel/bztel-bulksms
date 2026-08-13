import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

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

    const where: Prisma.UserWhereInput = { isAdmin: false };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          balance: true,
          createdAt: true,
          isAdmin: true,
          smsLogs: {
            select: {
              status: true,
              credits: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    const mappedCustomers = customers.map((u) => {
      let sent = 0;
      let failed = 0;
      let pending = 0;
      let creditsUsed = 0;

      for (const log of u.smsLogs) {
        if (log.status === 'sent' || log.status === 'submitted' || log.status === 'delivered') {
          sent++;
          creditsUsed += log.credits;
        } else if (log.status === 'failed') {
          failed++;
        } else if (log.status === 'pending') {
          pending++;
          creditsUsed += log.credits;
        }
      }

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        status: u.status,
        balance: u.balance,
        created_at: u.createdAt,
        is_admin: u.isAdmin,
        total_sent: sent,
        total_failed: failed,
        total_pending: pending,
        credits_used: creditsUsed,
      };
    });

    // Platform-wide stats — always computed from the full (non-admin) dataset,
    // independent of the current search/pagination window.
    const [totalCustomers, activeCount, suspendedCount, groupTotals] = await Promise.all([
      prisma.user.count({ where: { isAdmin: false } }),
      prisma.user.count({ where: { isAdmin: false, status: 'active' } }),
      prisma.user.count({ where: { isAdmin: false, status: 'suspended' } }),
      prisma.smsLog.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    let platformSent = 0;
    let platformPending = 0;
    let platformFailed = 0;

    for (const t of groupTotals) {
      const count = t._count._all || 0;
      if (t.status === 'sent' || t.status === 'submitted' || t.status === 'delivered') {
        platformSent += count;
      } else if (t.status === 'pending') {
        platformPending += count;
      } else if (t.status === 'failed') {
        platformFailed += count;
      }
    }

    return NextResponse.json({
      customers: mappedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      platform_stats: {
        total_customers: totalCustomers,
        active: activeCount,
        suspended: suspendedCount,
        total_sms_sent: platformSent,
        total_sms_pending: platformPending,
        total_sms_failed: platformFailed,
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
