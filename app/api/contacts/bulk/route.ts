import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];

interface BulkContactInput {
  name?: string;
  phone?: string;
  group_name?: string;
  birthdate?: string;
}

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

    const { contacts } = await req.json();
    const ownerId = authUser.owner_id;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty contacts list' }, { status: 400 });
    }

    const inserted = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of contacts as BulkContactInput[]) {
        const { name, phone, group_name, birthdate } = item;
        if (!name || !phone) continue; // Skip invalid rows

        const group = group_name ? group_name.trim() : 'Default';

        const contact = await tx.contact.create({
          data: {
            userId: ownerId,
            name: name.trim(),
            phone: phone.trim(),
            groupName: group,
            birthdate: birthdate ? birthdate.trim() : null,
          },
        });

        results.push({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          group_name: contact.groupName,
          birthdate: contact.birthdate
        });
      }
      return results;
    });

    return NextResponse.json({
      message: `Successfully imported ${inserted.length} contacts`,
      count: inserted.length,
      contacts: inserted
    }, { status: 201 });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Failed to bulk import contacts' }, { status: 500 });
  }
}
