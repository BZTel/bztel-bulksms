import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];

// GET all contacts
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const contacts = await prisma.contact.findMany({
      where: { userId: ownerId },
      orderBy: [
        { groupName: 'asc' },
        { name: 'asc' },
      ],
    });

    // Map to snake_case structure compatible with original frontend
    const legacyContacts = contacts.map((c) => ({
      id: c.id,
      user_id: c.userId,
      name: c.name,
      phone: c.phone,
      group_name: c.groupName,
      birthdate: c.birthdate,
      created_at: c.createdAt,
    }));

    return NextResponse.json({ contacts: legacyContacts });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST single contact
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

    const { name, phone, group_name, birthdate } = await req.json();
    const ownerId = authUser.owner_id;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 });
    }

    const group = group_name ? group_name.trim() : 'Default';

    const contact = await prisma.contact.create({
      data: {
        userId: ownerId,
        name: name.trim(),
        phone: phone.trim(),
        groupName: group,
        birthdate: birthdate ? birthdate.trim() : null,
      },
    });

    return NextResponse.json({
      message: 'Contact added successfully',
      contact: {
        id: contact.id,
        user_id: contact.userId,
        name: contact.name,
        phone: contact.phone,
        group_name: contact.groupName,
        birthdate: contact.birthdate
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Add contact error:', error);
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }
}
