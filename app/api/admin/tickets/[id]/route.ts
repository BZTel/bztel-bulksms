import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// PATCH update support ticket status or priority (Admin only)
export async function PATCH(
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
    const ticketId = Number(id);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid Ticket ID' }, { status: 400 });
    }

    const { status, priority } = await req.json();

    const existing = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Support ticket not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority.toLowerCase())) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
      }
      updateData.priority = priority.toLowerCase();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData
    });

    return NextResponse.json({
      message: 'Support ticket successfully updated',
      ticket: {
        id: updated.id,
        status: updated.status,
        priority: updated.priority,
        subject: updated.subject
      }
    });
  } catch (error) {
    console.error('Admin update support ticket error:', error);
    return NextResponse.json({ error: 'Failed to update support ticket' }, { status: 500 });
  }
}
