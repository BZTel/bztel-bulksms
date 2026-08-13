import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty ids list' }, { status: 400 });
    }

    const numericIds = ids.map(Number);

    const deleted = await prisma.contactMessage.deleteMany({
      where: { id: { in: numericIds } },
    });

    return NextResponse.json({
      message: `${deleted.count} website inquiry message(s) deleted successfully`,
      count: deleted.count,
    });
  } catch (error) {
    console.error('Admin bulk delete contact-messages error:', error);
    return NextResponse.json({ error: 'Failed to bulk delete website inquiries' }, { status: 500 });
  }
}
