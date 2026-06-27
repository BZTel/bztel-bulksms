import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const ALLOWED_WRITE_ROLES = ['Owner', 'Administrator', 'Marketing Agent'];

interface BulkContactInput {
  name?: string;
  phone?: string;
  email?: string;
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
        const { name, phone, email, group_name, birthdate } = item;
        const contactPhone = phone ? phone.trim() : '';
        if (!contactPhone) continue; // Skip invalid rows without a phone number

        const contactName = name ? name.trim() : contactPhone;
        const group = group_name ? group_name.trim() : 'Default';

        const contact = await tx.contact.create({
          data: {
            userId: ownerId,
            name: contactName,
            phone: contactPhone,
            email: email ? email.trim().toLowerCase() : null,
            groupName: group,
            birthdate: birthdate ? birthdate.trim() : null,
          },
        });

        results.push({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
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

// PATCH to update the group name of multiple contacts at once
export async function PATCH(req: Request) {
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

    const { contactIds, group_name } = await req.json();
    const ownerId = authUser.owner_id;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty contact IDs list' }, { status: 400 });
    }

    const group = group_name ? group_name.trim() : 'Default';
    const numericIds = contactIds.map(Number);

    const updated = await prisma.contact.updateMany({
      where: {
        id: { in: numericIds },
        userId: ownerId,
      },
      data: {
        groupName: group,
      },
    });

    return NextResponse.json({
      message: `Successfully updated ${updated.count} contacts to group: ${group}`,
      count: updated.count,
    });
  } catch (error) {
    console.error('Bulk update group error:', error);
    return NextResponse.json({ error: 'Failed to bulk update contacts group' }, { status: 500 });
  }
}

// DELETE to bulk-delete multiple contacts at once
export async function DELETE(req: Request) {
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

    const { contactIds } = await req.json();
    const ownerId = authUser.owner_id;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty contact IDs list' }, { status: 400 });
    }

    const numericIds = contactIds.map(Number);

    const deleted = await prisma.contact.deleteMany({
      where: {
        id: { in: numericIds },
        userId: ownerId,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${deleted.count} contacts`,
      count: deleted.count,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Failed to bulk delete contacts' }, { status: 500 });
  }
}
