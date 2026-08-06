import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];

// GET templates
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const templates = await prisma.template.findMany({
      where: { userId: ownerId },
      orderBy: { name: 'asc' },
    });

    // Transform fields back to snake_case format compatible with original dashboard frontend
    const legacyTemplates = templates.map((t) => ({
      id: t.id,
      user_id: t.userId,
      name: t.name,
      content: t.content,
      created_at: t.createdAt,
    }));

    return NextResponse.json({ templates: legacyTemplates });
  } catch (error) {
    console.error('Fetch templates error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST create template
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

    const { name, content } = await req.json();
    const ownerId = authUser.owner_id;

    if (!name || !content) {
      return NextResponse.json({ error: 'Template name and content are required' }, { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        userId: ownerId,
        name: name.trim(),
        content: content.trim(),
      },
    });

    return NextResponse.json({
      message: 'Template created successfully',
      template: {
        id: template.id,
        name: template.name,
        content: template.content,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
