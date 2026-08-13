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

    const { ids, status, rejection_reason } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty ids list' }, { status: 400 });
    }
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be either "approved" or "rejected"' }, { status: 400 });
    }

    const numericIds = ids.map(Number);

    const updated = await prisma.senderId.updateMany({
      where: { id: { in: numericIds } },
      data: {
        status,
        rejectionReason: status === 'rejected' ? (rejection_reason || 'Vetting document mismatch') : null,
      },
    });

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      authUser.id,
      status === 'approved' ? 'SENDER_ID_APPROVED' : 'SENDER_ID_REJECTED',
      `Admin bulk-${status} ${updated.count} Sender ID request(s) (IDs: ${numericIds.join(', ')})`,
      clientIp
    );

    return NextResponse.json({
      message: `${updated.count} Sender ID request(s) successfully ${status}`,
      count: updated.count,
    });
  } catch (error) {
    console.error('Admin bulk update sender-id error:', error);
    return NextResponse.json({ error: 'Failed to bulk update Sender ID requests' }, { status: 500 });
  }
}
