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

    const history = await prisma.voiceLog.findMany({
      where: { userId: ownerId },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    // Map fields to snake_case format compatible with original dashboard frontend
    const legacyHistory = history.map((log) => ({
      id: log.id,
      user_id: log.userId,
      sender_id: log.senderId,
      recipient: log.recipient,
      audio_url: log.audioUrl,
      tts_text: log.ttsText,
      duration: log.duration,
      credits: log.credits,
      status: log.status,
      sent_at: log.sentAt,
    }));

    return NextResponse.json({ history: legacyHistory });
  } catch (error) {
    console.error('Fetch voice history error:', error);
    return NextResponse.json({ error: 'Failed to fetch voice broadcast logs' }, { status: 500 });
  }
}
