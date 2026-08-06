import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET all Sender ID requests (Admin only)
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const senderIds = await prisma.senderId.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedList = senderIds.map(s => ({
      id: s.id,
      user_id: s.userId,
      email: s.user.email,
      name: s.name,
      description: s.description,
      status: s.status,
      rejection_reason: s.rejectionReason,
      document_url: s.documentUrl,
      created_at: s.createdAt
    }));

    return NextResponse.json({ sender_ids: formattedList });
  } catch (error) {
    console.error('Admin fetch sender-ids error:', error);
    return NextResponse.json({ error: 'Failed to fetch Sender ID requests' }, { status: 500 });
  }
}
