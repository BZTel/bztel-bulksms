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
    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Status must be "active" or "suspended"' }, { status: 400 });
    }

    const numericIds = ids.map(Number);

    const updated = await prisma.user.updateMany({
      where: {
        id: { in: numericIds },
        isAdmin: false,
      },
      data: { status },
    });

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      authUser.id,
      status === 'suspended' ? 'ADMIN_USER_SUSPEND' : 'ADMIN_USER_REACTIVATE',
      `Admin bulk-updated ${updated.count} user(s) to status: ${status} (IDs: ${numericIds.join(', ')})`,
      clientIp
    );

    return NextResponse.json({
      message: `${updated.count} account(s) ${status === 'suspended' ? 'suspended' : 'reactivated'} successfully.`,
      count: updated.count,
    });
  } catch (error) {
    console.error('Admin bulk update user status error:', error);
    return NextResponse.json({ error: 'Failed to bulk update account status' }, { status: 500 });
  }
}
