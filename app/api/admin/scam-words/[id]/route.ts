import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// PUT update a scam word
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const scamWordId = Number(id);
    if (isNaN(scamWordId)) {
      return NextResponse.json({ error: 'Invalid scam word ID' }, { status: 400 });
    }

    const { word, category } = await req.json();
    if (!word || typeof word !== 'string' || !word.trim()) {
      return NextResponse.json({ error: 'Word cannot be empty' }, { status: 400 });
    }

    const updated = await prisma.scamWord.update({
      where: { id: scamWordId },
      data: {
        word: word.trim().toLowerCase(),
        category: category || 'general'
      }
    });

    return NextResponse.json({ message: 'Scam word updated successfully', scam_word: updated });
  } catch (error) {
    console.error('Update scam word error:', error);
    return NextResponse.json({ error: 'Failed to update scam word' }, { status: 500 });
  }
}

// DELETE a scam word
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser || !authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const scamWordId = Number(id);
    if (isNaN(scamWordId)) {
      return NextResponse.json({ error: 'Invalid scam word ID' }, { status: 400 });
    }

    await prisma.scamWord.delete({
      where: { id: scamWordId }
    });

    return NextResponse.json({ message: 'Scam word deleted successfully' });
  } catch (error) {
    console.error('Delete scam word error:', error);
    return NextResponse.json({ error: 'Failed to delete scam word' }, { status: 500 });
  }
}

