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
    const senderId = searchParams.get('senderId')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.SmsLogWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (senderId) {
      where.senderId = { contains: senderId, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: 'insensitive' } },
        { senderId: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.smsLog.count({ where }),
      prisma.smsLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        skip,
        take: limit,
      })
    ]);

    const formattedLogs = logs.map((l) => ({
      id: l.id,
      user_id: l.userId,
      email: l.user?.email || 'Unknown',
      sender_id: l.senderId,
      recipient: l.recipient,
      message: l.message,
      credits: l.credits,
      status: l.status,
      provider_id: l.providerId || null,
      batch_id: l.batchId || null,
      sent_at: l.sentAt.toISOString(),
    }));

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Fetch admin SMS logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin SMS logs' }, { status: 500 });
  }
}
