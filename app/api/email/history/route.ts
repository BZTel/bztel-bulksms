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

    const history = await prisma.emailLog.findMany({
      where: { userId: ownerId },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    // Map fields back to snake_case format compatible with dashboard frontend
    const legacyHistory = history.map((log) => ({
      id: log.id,
      user_id: log.userId,
      sender_name: log.senderName,
      sender_email: log.senderEmail,
      recipient: log.recipient,
      subject: log.subject,
      body_html: log.bodyHtml,
      credits: log.credits,
      status: log.status,
      sent_at: log.sentAt,
    }));

    return NextResponse.json({ history: legacyHistory });
  } catch (error) {
    console.error('Fetch Email history error:', error);
    return NextResponse.json({ error: 'Failed to fetch Email logs' }, { status: 500 });
  }
}
