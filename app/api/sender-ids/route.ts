import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];
const SENDER_ID_REGEX = /^[a-zA-Z0-9]{2,11}$/;

// GET user's Sender IDs
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const senderIds = await prisma.senderId.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' }
    });

    // Map to camel/snake compatibility
    const formattedList = senderIds.map(s => ({
      id: s.id,
      user_id: s.userId,
      name: s.name,
      description: s.description,
      status: s.status,
      rejection_reason: s.rejectionReason,
      document_url: s.documentUrl,
      created_at: s.createdAt
    }));

    return NextResponse.json({ sender_ids: formattedList });
  } catch (error) {
    console.error('Fetch sender-ids error:', error);
    return NextResponse.json({ error: 'Failed to fetch Sender IDs' }, { status: 500 });
  }
}

// POST new Sender ID request
export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_WRITE_ROLES.includes(authUser.role)) {
      return NextResponse.json({
        error: `Access denied. Insufficient permissions.`
      }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string | null;
    const description = formData.get('description') as string | null;
    const documentFile = formData.get('document') as File | null;
    const ownerId = authUser.owner_id;

    if (!name || !description) {
      return NextResponse.json({ error: 'Sender ID name and description/use-case are required' }, { status: 400 });
    }

    const trimmedName = name.trim().toUpperCase();

    if (!SENDER_ID_REGEX.test(trimmedName)) {
      return NextResponse.json({
        error: 'Sender ID must be between 2 and 11 alphanumeric characters (no spaces or special characters).'
      }, { status: 400 });
    }

    // Check if duplicate Sender ID exists
    const duplicate = await prisma.senderId.findUnique({
      where: { name: trimmedName }
    });

    if (duplicate) {
      return NextResponse.json({
        error: `The Sender ID "${trimmedName}" is already registered or requested by another account.`
      }, { status: 400 });
    }

    let documentUrl: string | null = null;
    if (documentFile && documentFile.size > 0) {
      const bytes = await documentFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const safeFilename = `${Date.now()}-${documentFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = join(uploadDir, safeFilename);
      await writeFile(filePath, buffer);

      documentUrl = `/uploads/${safeFilename}`;
    }

    const newSenderId = await prisma.senderId.create({
      data: {
        userId: ownerId,
        name: trimmedName,
        description: description.trim(),
        documentUrl,
        status: 'pending'
      }
    });

    return NextResponse.json({
      message: 'Sender ID verification request submitted successfully',
      sender_id: {
        id: newSenderId.id,
        user_id: newSenderId.userId,
        name: newSenderId.name,
        status: newSenderId.status,
        description: newSenderId.description,
        created_at: newSenderId.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Request sender-id error:', error);
    return NextResponse.json({ error: 'Failed to submit Sender ID request' }, { status: 500 });
  }
}
