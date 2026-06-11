import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all non-admin users with their SMS logs
    const customers = await prisma.user.findMany({
      where: { isAdmin: false },
      select: {
        id: true,
        email: true,
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
    });

    const mappedCustomers = customers.map((u) => {
      let sent = 0;
      let failed = 0;
      let pending = 0;
      let creditsUsed = 0;

      for (const log of u.smsLogs) {
        if (log.status === 'sent') {
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

    // Aggregated platform totals
    const groupTotals = await prisma.smsLog.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    let platformSent = 0;
    let platformPending = 0;
    let platformFailed = 0;

    for (const t of groupTotals) {
      const count = t._count._all || 0;
      if (t.status === 'sent') {
        platformSent = count;
      } else if (t.status === 'pending') {
        platformPending = count;
      } else if (t.status === 'failed') {
        platformFailed = count;
      }
    }

    return NextResponse.json({
      customers: mappedCustomers,
      platform_stats: {
        total_customers: mappedCustomers.length,
        active: mappedCustomers.filter((u) => u.status === 'active').length,
        suspended: mappedCustomers.filter((u) => u.status === 'suspended').length,
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
