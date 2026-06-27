import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

// PATCH update service request status (Admin only)
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
    const requestId = Number(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid Request ID' }, { status: 400 });
    }

    const { status } = await req.json();

    if (!status || !['Reviewing', 'Approved', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Status must be one of: "Reviewing", "Approved", "Declined"' }, { status: 400 });
    }

    const existing = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status }
    });

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      updated.userId,
      'ADMIN_SERVICE_REQUEST_UPDATE',
      `Admin updated service request ID ${requestId} (${updated.serviceType}) status to: ${updated.status}`,
      clientIp
    );

    return NextResponse.json({
      message: `Service request successfully updated to ${status}`,
      request: {
        id: updated.id,
        status: updated.status,
        serviceType: updated.serviceType,
        repName: updated.repName,
      }
    });
  } catch (error) {
    console.error('Admin update service request error:', error);
    return NextResponse.json({ error: 'Failed to update custom service request' }, { status: 500 });
  }
}
