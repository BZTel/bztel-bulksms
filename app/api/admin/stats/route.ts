import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Run aggregate queries concurrently for optimal performance
    const [
      totalUsers,
      totalSms,
      deliveredSms,
      failedSms,
      smsCreditsSum,
      topupsSum,
      pendingSenderIds,
      pendingServices,
      openTickets
    ] = await Promise.all([
      prisma.user.count(),
      prisma.smsLog.count(),
      prisma.smsLog.count({ where: { status: { in: ['delivered', 'sent', 'submitted'] } } }),
      prisma.smsLog.count({ where: { status: 'failed' } }),
      prisma.smsLog.aggregate({ _sum: { credits: true } }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'topup' }
      }),
      prisma.senderId.count({ where: { status: 'pending' } }),
      prisma.serviceRequest.count({ where: { status: 'pending' } }),
      prisma.supportTicket.count({ where: { status: 'open' } })
    ]);

    const totalCreditsUsed = smsCreditsSum._sum.credits || 0;
    const totalTopupAmount = topupsSum._sum.amount || 0;
    const successRate = totalSms > 0 ? Math.round((deliveredSms / totalSms) * 100) : 100;

    // Fetch 5 most recent SMS logs for preview
    const recentSms = await prisma.smsLog.findMany({
      take: 5,
      orderBy: { sentAt: 'desc' },
      include: {
        user: { select: { email: true } }
      }
    });

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
        openTickets
      },
      recentSms: recentSms.map((s) => ({
        id: s.id,
        user_email: s.user?.email || 'Unknown',
        sender_id: s.senderId,
        recipient: s.recipient,
        message: s.message,
        credits: s.credits,
        status: s.status,
        sent_at: s.sentAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
