import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    console.error('Stats query fallback error:', e);
    return fallback;
  }
};

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Run aggregate queries concurrently with safe fallbacks
    const [
      totalUsers,
      totalSms,
      deliveredSms,
      failedSms,
      smsCreditsSum,
      topupsSum,
      pendingSenderIds,
      pendingServices,
      openTickets,
      totalScamWords
    ] = await Promise.all([
      safe(() => prisma.user.count(), 0),
      safe(() => prisma.smsLog.count(), 0),
      safe(() => prisma.smsLog.count({ where: { status: { in: ['delivered', 'sent', 'submitted'] } } }), 0),
      safe(() => prisma.smsLog.count({ where: { status: 'failed' } }), 0),
      safe(() => prisma.smsLog.aggregate({ _sum: { credits: true } }), { _sum: { credits: null } }),
      safe(() => prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'topup' } }), { _sum: { amount: null } }),
      safe(() => prisma.senderId.count({ where: { status: 'pending' } }), 0),
      safe(() => prisma.serviceRequest.count({ where: { status: 'pending' } }), 0),
      safe(() => prisma.supportTicket.count({ where: { status: { in: ['open', 'Open'] } } }), 0),
      safe(() => prisma.scamWord.count(), 0)
    ]);

    const totalCreditsUsed = smsCreditsSum._sum.credits || 0;
    const totalTopupAmount = topupsSum._sum.amount || 0;
    const successRate = totalSms > 0 ? Math.round((deliveredSms / totalSms) * 100) : 100;

    // Fetch 5 most recent SMS logs for preview
    const recentSms = await safe(
      () => prisma.smsLog.findMany({
        take: 5,
        orderBy: { sentAt: 'desc' },
        include: {
          user: { select: { email: true } }
        }
      }),
      []
    );

    return NextResponse.json({
      stats: {
        totalUsers,
        totalSms,
        deliveredSms,
        failedSms,
        totalCreditsUsed,
        totalTopupAmount,
        successRate,
        pendingSenderIds,
        pendingServices,
        openTickets,
        totalScamWords
      },
      recentSms: recentSms.map((s) => ({
        id: s.id,
        user_email: s.user?.email || 'Unknown',
        sender_id: s.senderId,
        recipient: s.recipient,
        message: s.message,
        credits: s.credits,
        status: s.status,
        sent_at: s.sentAt ? s.sentAt.toISOString() : new Date().toISOString()
      }))
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
