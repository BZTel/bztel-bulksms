import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

// GET single customer full profile + SMS history
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isAdmin) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get SMS stats for this user
    const statsResult = await prisma.smsLog.groupBy({
      by: ['status'],
      where: { userId },
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

    for (const group of statsResult) {
      const count = group._count._all || 0;
      const credits = group._sum.credits || 0;

      if (group.status === 'sent' || group.status === 'submitted') {
        sent += count;
        totalCreditsUsed += credits;
      } else if (group.status === 'failed') {
        failed += count;
      } else if (group.status === 'pending') {
        pending += count;
        totalCreditsUsed += credits;
      }
    }

    // Get top 20 recent logs
    const recentLogs = await prisma.smsLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 20,
    });

    const legacyRecentLogs = recentLogs.map((log) => ({
      id: log.id,
      user_id: log.userId,
      sender_id: log.senderId,
      recipient: log.recipient,
      message: log.message,
      credits: log.credits,
      status: log.status,
      sent_at: log.sentAt,
    }));

    return NextResponse.json({
      customer: {
        id: user.id,
        email: user.email,
        status: user.status,
        balance: user.balance,
        role: user.role,
        parent_user_id: user.parentUserId,
        created_at: user.createdAt,
        is_admin: user.isAdmin,
        total_sent: sent,
        total_failed: failed,
        total_pending: pending,
        credits_used: totalCreditsUsed,
      },
      recent_logs: legacyRecentLogs,
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// DELETE customer and all their data permanently
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isAdmin) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete user (Prisma cascade delete will trigger automatically for sub-relations)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      authUser.id,
      'ADMIN_USER_DELETE',
      `Admin permanently deleted user ID ${userId} (${user.email}) and all their data`,
      clientIp
    );

    return NextResponse.json({
      message: `Customer ${user.email} and all their data deleted successfully.`,
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
