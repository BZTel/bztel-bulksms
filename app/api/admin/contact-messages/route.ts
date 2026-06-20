import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET all website inquiries (Admin only)
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      created_at: m.createdAt,
    }));

    return NextResponse.json({ contact_messages: formattedMessages });
  } catch (error) {
    console.error('Admin fetch contact-messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch website inquiries' }, { status: 500 });
  }
}
