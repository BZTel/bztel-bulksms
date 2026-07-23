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

    const history = await prisma.smsLog.findMany({
      where: { userId: ownerId },
      orderBy: { sentAt: 'desc' },
      take: 500,
    });

    // Map fields back to snake_case format compatible with original dashboard frontend
    const legacyHistory = history.map((log) => ({
      id: log.id,
      user_id: log.userId,
      sender_id: log.senderId,
      recipient: log.recipient,
      message: log.message,
      credits: log.credits,
      status: log.status,
      sent_at: log.sentAt,
      batch_id: log.batchId,
    }));

    return NextResponse.json({ history: legacyHistory });
  } catch (error) {
    console.error('Fetch SMS history error:', error);
    return NextResponse.json({ error: 'Failed to fetch SMS logs' }, { status: 500 });
  }
}
