import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];

// PUT update draft
export async function PUT(
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
    const draftId = Number(id);
    const ownerId = authUser.owner_id;

    const existingDraft = await prisma.draft.findFirst({
      where: {
        id: draftId,
        userId: ownerId,
      },
    });

    if (!existingDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const { senderId, recipients, message } = await req.json();

    let recipientsStr = '';
    if (Array.isArray(recipients)) {
      recipientsStr = recipients.join(', ');
    } else if (typeof recipients === 'string') {
      recipientsStr = recipients;
    }

    const updated = await prisma.draft.update({
      where: { id: draftId },
      data: {
        senderId: senderId !== undefined ? senderId.trim() : existingDraft.senderId,
        recipients: recipients !== undefined ? recipientsStr.trim() : existingDraft.recipients,
        message: message !== undefined ? message.trim() : existingDraft.message,
      },
    });

    return NextResponse.json({
      message: 'Draft updated successfully',
      draft: {
        id: updated.id,
        sender_id: updated.senderId,
        recipients: updated.recipients,
        message: updated.message,
        created_at: updated.createdAt,
      }
    });
  } catch (error) {
    console.error('Update draft error:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

// DELETE draft
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
    const draftId = Number(id);
    const ownerId = authUser.owner_id;

    const existingDraft = await prisma.draft.findFirst({
      where: {
        id: draftId,
        userId: ownerId,
      },
    });

    if (!existingDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    await prisma.draft.delete({
      where: { id: draftId },
    });

    return NextResponse.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}
