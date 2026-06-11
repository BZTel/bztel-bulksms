import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    // Get owner details to check balance
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { balance: true },
    });

    if (!owner) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get SMS counts grouped by status
    const groupCounts = await prisma.smsLog.groupBy({
      by: ['status'],
      where: { userId: ownerId },
      _count: {
        _all: true,
      },
      _sum: {
        credits: true,
      },
    });

    let sent = 0;
    let failed = 0;
    let pending = 0;
    let totalCreditsUsed = 0;

    for (const group of groupCounts) {
      const count = group._count._all || 0;
      const credits = group._sum.credits || 0;

      if (group.status === 'sent') {
        sent = count;
        totalCreditsUsed += credits;
      } else if (group.status === 'failed') {
        failed = count;
      } else if (group.status === 'pending') {
        pending = count;
        totalCreditsUsed += credits;
      }
    }

    // Get daily stats for last 7 days (database-agnostic aggregation)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logsForChart = await prisma.smsLog.findMany({
      where: {
        userId: ownerId,
        sentAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        sentAt: true,
        status: true,
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    const chartMap = new Map<string, { date: string; count: number; delivered: number }>();
    
    // Initialize last 7 days with zero counts
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      chartMap.set(dateStr, { date: dateStr, count: 0, delivered: 0 });
    }

    for (const log of logsForChart) {
      // Adjust sentAt to local or UTC date string depending on implementation
      const dateStr = log.sentAt.toISOString().slice(0, 10);
      if (chartMap.has(dateStr)) {
        const entry = chartMap.get(dateStr)!;
        entry.count++;
        if (log.status === 'sent') {
          entry.delivered++;
        }
      }
    }

    const chartData = Array.from(chartMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      balance: owner.balance,
      total_sent: sent,
      total_failed: failed,
      total_pending: pending,
      total_credits_used: totalCreditsUsed,
      chart_data: chartData
    });
  } catch (error) {
    console.error('Fetch SMS stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch SMS statistics' }, { status: 500 });
  }
}
