import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_WRITE_ROLES.includes(authUser.role)) {
      return NextResponse.json({ 
        error: `Access denied. Insufficient role permissions. Allowed: ${ALLOWED_WRITE_ROLES.join(', ')}` 
      }, { status: 403 });
    }

    const { id } = await params;
    const campaignId = Number(id);
    const ownerId = authUser.owner_id;

    const existing = await prisma.birthdayCampaign.findFirst({
      where: {
        id: campaignId,
        userId: ownerId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await prisma.birthdayCampaign.delete({
      where: { id: campaignId },
    });

    return NextResponse.json({ message: 'Birthday campaign disabled' });
  } catch (error) {
    console.error('Delete birthday campaign error:', error);
    return NextResponse.json({ error: 'Failed to delete birthday campaign' }, { status: 500 });
  }
}
