import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

const ALLOWED_REMOVE_ROLES = ['Owner', 'Administrator'];

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_REMOVE_ROLES.includes(authUser.role)) {
      return NextResponse.json({ 
        error: `Access denied. Insufficient role permissions. Allowed: ${ALLOWED_REMOVE_ROLES.join(', ')}` 
      }, { status: 403 });
    }

    const { id } = await params;
    const memberId = Number(id);
    const ownerId = authUser.owner_id;

    if (memberId === ownerId) {
      return NextResponse.json({ error: 'Cannot remove the organization owner' }, { status: 400 });
    }

    // Check if coworker exists in organization
    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        parentUserId: ownerId,
      },
      select: { id: true, email: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: memberId },
    });

    // Audit log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      authUser.id,
      'TEAM_MEMBER_REMOVE',
      `Removed coworker ID ${memberId} (${member.email}) from organization`,
      clientIp
    );

    return NextResponse.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Remove coworker error:', error);
    return NextResponse.json({ error: 'Failed to remove coworker' }, { status: 500 });
  }
}
