import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

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
    const senderId = Number(id);

    if (isNaN(senderId)) {
      return NextResponse.json({ error: 'Invalid Sender ID' }, { status: 400 });
    }

    const { status, rejection_reason } = await req.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be either "approved" or "rejected"' }, { status: 400 });
    }

    // Check if the Sender ID request exists
    const existing = await prisma.senderId.findUnique({
      where: { id: senderId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Sender ID request not found' }, { status: 404 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Update the request status
    const updated = await prisma.senderId.update({
      where: { id: senderId },
      data: {
        status,
        rejectionReason: status === 'rejected' ? (rejection_reason || 'Vetting document mismatch') : null
      }
    });

    // Write audit log
    const auditAction = status === 'approved' ? 'SENDER_ID_APPROVED' : 'SENDER_ID_REJECTED';
    const auditDetails = status === 'approved' 
      ? `Sender ID "${updated.name}" approved`
      : `Sender ID "${updated.name}" rejected: ${updated.rejectionReason}`;
      
    await logAuditEvent(updated.userId, auditAction, auditDetails, clientIp);

    return NextResponse.json({
      message: `Sender ID successfully ${status}`,
      sender_id: {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        rejection_reason: updated.rejectionReason
      }
    });
  } catch (error) {
    console.error('Admin update sender-id error:', error);
    return NextResponse.json({ error: 'Failed to update Sender ID request' }, { status: 500 });
  }
}
