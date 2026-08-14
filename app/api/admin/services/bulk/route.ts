import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

// Approving a Bank Transfer service request credits real money based on an amount the
// admin must independently verify against their bank statement (see the [id] route for
// why — the customer-submitted figure is never independently verified). That
// confirmation step doesn't fit a batch action, so Bank Transfer rows are deliberately
// excluded from bulk-approve entirely and must go through the individual-approval route
// instead. Every other service type is a plain status flip with no money involved.
async function approveOne(requestId: number, clientIp: string) {
  const existing = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!existing) return { requestId, ok: false, error: 'Service request not found' };
  if (existing.status === 'Approved') return { requestId, ok: true, skipped: true };

  if (existing.serviceType === 'Bank Transfer') {
    return {
      requestId,
      ok: false,
      error: 'Bank Transfer requests must be approved individually with a verified credit amount — use the Approve button on that row.',
    };
  }

  const updated = await prisma.serviceRequest.update({ where: { id: requestId }, data: { status: 'Approved' } });

  await logAuditEvent(
    updated.userId,
    'ADMIN_SERVICE_REQUEST_UPDATE',
    `Admin updated service request ID ${requestId} (${updated.serviceType}) status to: Approved`,
    clientIp
  );

  return { requestId, ok: true };
}

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
    if (!status || !['Reviewing', 'Approved', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Status must be one of: "Reviewing", "Approved", "Declined"' }, { status: 400 });
    }

    const numericIds = ids.map(Number);
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (status === 'Approved') {
      // Process sequentially — each row may credit real money, so failures on one
      // request must not block or roll back the others.
      const results = [];
      for (const id of numericIds) {
        results.push(await approveOne(id, clientIp));
      }
      const succeeded = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok);

      return NextResponse.json({
        message: `${succeeded} of ${numericIds.length} service request(s) approved${failed.length ? `, ${failed.length} failed` : ''}`,
        count: succeeded,
        failures: failed,
      });
    }

    const updated = await prisma.serviceRequest.updateMany({
      where: { id: { in: numericIds } },
      data: { status },
    });

    await logAuditEvent(
      authUser.id,
      'ADMIN_SERVICE_REQUEST_UPDATE',
      `Admin bulk-updated ${updated.count} service request(s) to status: ${status} (IDs: ${numericIds.join(', ')})`,
      clientIp
    );

    return NextResponse.json({
      message: `${updated.count} service request(s) updated to ${status}`,
      count: updated.count,
    });
  } catch (error) {
    console.error('Admin bulk update service requests error:', error);
    return NextResponse.json({ error: 'Failed to bulk update service requests' }, { status: 500 });
  }
}
