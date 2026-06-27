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
    const userId = Number(id);
    const { status } = await req.json();

    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Status must be "active" or "suspended"' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isAdmin) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      authUser.id,
      status === 'suspended' ? 'ADMIN_USER_SUSPEND' : 'ADMIN_USER_REACTIVATE',
      `Admin updated user ID ${userId} status to ${status}`,
      clientIp
    );

    return NextResponse.json({
      message: `Account ${status === 'suspended' ? 'suspended' : 'reactivated'} successfully.`,
      status,
    });
  } catch (error) {
    console.error('Admin update status error:', error);
    return NextResponse.json({ error: 'Failed to update account status' }, { status: 500 });
  }
}
