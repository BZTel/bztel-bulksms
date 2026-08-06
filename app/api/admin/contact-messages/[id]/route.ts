import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// DELETE a website inquiry (Admin only)
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
    const messageId = Number(id);

    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'Invalid Inquiry ID' }, { status: 400 });
    }

    const existing = await prisma.contactMessage.findUnique({
      where: { id: messageId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Inquiry message not found' }, { status: 404 });
    }

    await prisma.contactMessage.delete({
      where: { id: messageId }
    });

    return NextResponse.json({
      message: 'Website inquiry message deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete contact-message error:', error);
    return NextResponse.json({ error: 'Failed to delete website inquiry' }, { status: 500 });
  }
}
