import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_ROLES = ['Owner', 'Administrator'];

// GET API keys
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const keys = await prisma.apiKey.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });

    // Mask API keys for safety before returning
    const maskedKeys = keys.map((k) => ({
      id: k.id,
      name: k.name,
      key: k.key.substring(0, 11) + '...' + k.key.substring(k.key.length - 4),
      created_at: k.createdAt,
    }));

    return NextResponse.json({ keys: maskedKeys });
  } catch (error) {
    console.error('Fetch keys error:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

// POST create API key
export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(authUser.role)) {
      return NextResponse.json({ 
        error: `Access denied. Insufficient role permissions. Allowed: ${ALLOWED_ROLES.join(', ')}` 
      }, { status: 403 });
    }

    const { name } = await req.json();
    const ownerId = authUser.owner_id;

    if (!name) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    const secureKey = 'bztel_live_' + crypto.randomBytes(20).toString('hex');

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: ownerId,
        key: secureKey,
        name: name.trim(),
      },
    });

    return NextResponse.json({
      message: 'API Key generated successfully. Make sure to copy it now, it will not be shown again.',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: secureKey,
        created_at: apiKey.createdAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
  }
}
