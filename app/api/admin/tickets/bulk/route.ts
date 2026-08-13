import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function PATCH(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { ids, status } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty ids list' }, { status: 400 });
    }
    if (!status || !['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const numericIds = ids.map(Number);

    const updated = await prisma.supportTicket.updateMany({
      where: { id: { in: numericIds } },
      data: { status },
    });

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      authUser.id,
      'ADMIN_TICKET_UPDATE',
      `Admin bulk-updated ${updated.count} ticket(s) to status: ${status} (IDs: ${numericIds.join(', ')})`,
      clientIp
    );

    return NextResponse.json({
      message: `${updated.count} ticket(s) updated to ${status}`,
      count: updated.count,
    });
  } catch (error) {
    console.error('Admin bulk update tickets error:', error);
    return NextResponse.json({ error: 'Failed to bulk update tickets' }, { status: 500 });
  }
}
