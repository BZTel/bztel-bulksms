import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];

// GET drafts
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const drafts = await prisma.draft.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });

    // Transform fields back to snake_case format compatible with original dashboard frontend
    const legacyDrafts = drafts.map((d) => ({
      id: d.id,
      user_id: d.userId,
      sender_id: d.senderId,
      recipients: d.recipients,
      message: d.message,
      created_at: d.createdAt,
    }));

    return NextResponse.json({ drafts: legacyDrafts });
  } catch (error) {
    console.error('Fetch drafts error:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

// POST create draft
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

    const { senderId, recipients, message } = await req.json();
    const ownerId = authUser.owner_id;

    let recipientsStr = '';
    if (Array.isArray(recipients)) {
      recipientsStr = recipients.join(', ');
    } else if (typeof recipients === 'string') {
      recipientsStr = recipients;
    }

    const draft = await prisma.draft.create({
      data: {
        userId: ownerId,
        senderId: (senderId || 'BZTEL').trim(),
        recipients: recipientsStr.trim(),
        message: (message || '').trim(),
      },
    });

    return NextResponse.json({
      message: 'Draft saved successfully',
      draft: {
        id: draft.id,
        sender_id: draft.senderId,
        recipients: draft.recipients,
        message: draft.message,
        created_at: draft.createdAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create draft error:', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}
