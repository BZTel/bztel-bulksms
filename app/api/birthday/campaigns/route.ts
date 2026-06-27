import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];

// GET campaigns
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const campaigns = await prisma.birthdayCampaign.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });

    // Map to snake_case structure compatible with original dashboard frontend
    const legacyCampaigns = campaigns.map((c) => ({
      id: c.id,
      user_id: c.userId,
      sender_id: c.senderId,
      target_group: c.targetGroup,
      dispatch_time: c.dispatchTime,
      message_template: c.messageTemplate,
      is_active: c.isActive,
      created_at: c.createdAt,
    }));

    return NextResponse.json({ campaigns: legacyCampaigns });
  } catch (error) {
    console.error('Fetch birthday campaigns error:', error);
    return NextResponse.json({ error: 'Failed to fetch birthday campaigns' }, { status: 500 });
  }
}

// POST campaign
export async function POST(req: Request) {
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

    const { senderId, targetGroup, dispatchTime, messageTemplate } = await req.json();
    const ownerId = authUser.owner_id;

    if (!senderId || !targetGroup || !dispatchTime || !messageTemplate) {
      return NextResponse.json({ 
        error: 'Sender ID, Target Group, Dispatch Time, and Message Template are required' 
      }, { status: 400 });
    }

    const cleanSenderId = senderId.trim().substring(0, 11).toUpperCase();
    const cleanTargetGroup = targetGroup.trim();
    const cleanMessageTemplate = messageTemplate.trim();

    // Enforce Sender ID Verification Checks
    const isDefaultSender = cleanSenderId === 'BZTEL';
    
    const virtualNum = await prisma.virtualNumber.findFirst({
      where: { userId: ownerId, number: senderId.trim() }
    });

    const approvedCustom = await prisma.senderId.findFirst({
      where: { userId: ownerId, name: cleanSenderId, status: 'approved' }
    });

    if (!isDefaultSender && !virtualNum && !approvedCustom) {
      return NextResponse.json({ 
        error: 'Forbidden: Sender ID is unverified, pending review, or not assigned to your account.' 
      }, { status: 403 });
    }

    const existing = await prisma.birthdayCampaign.findFirst({
      where: {
        userId: ownerId,
        targetGroup: cleanTargetGroup,
      },
    });

    if (existing) {
      await prisma.birthdayCampaign.update({
        where: { id: existing.id },
        data: {
          senderId: cleanSenderId,
          dispatchTime,
          messageTemplate: cleanMessageTemplate,
          isActive: true,
        },
      });
      return NextResponse.json({ message: 'Birthday campaign updated successfully!' });
    } else {
      await prisma.birthdayCampaign.create({
        data: {
          userId: ownerId,
          senderId: cleanSenderId,
          targetGroup: cleanTargetGroup,
          dispatchTime,
          messageTemplate: cleanMessageTemplate,
          isActive: true,
        },
      });
      return NextResponse.json({ message: 'Birthday campaign activated successfully!' }, { status: 201 });
    }
  } catch (error) {
    console.error('Save birthday campaign error:', error);
    return NextResponse.json({ error: 'Failed to save birthday campaign' }, { status: 500 });
  }
}
