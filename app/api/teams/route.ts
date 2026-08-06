import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    // Fetch owner and sub-users under this owner
    const members = await prisma.user.findMany({
      where: {
        OR: [
          { id: ownerId },
          { parentUserId: ownerId }
        ]
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: [
        // Sort with Owner first, then by email
        { role: 'asc' }, // Note: 'Owner' < 'Reporter' alphabetically, but let's do customized sorting in JS if needed.
        { email: 'asc' }
      ]
    });

    // Custom sort: Owner always first
    const sortedMembers = members.sort((a, b) => {
      if (a.role === 'Owner') return -1;
      if (b.role === 'Owner') return 1;
      return a.email.localeCompare(b.email);
    });

    // Map to snake_case structure compatible with original frontend
    const legacyMembers = sortedMembers.map((m) => ({
      id: m.id,
      email: m.email,
      role: m.role,
      status: m.status,
      created_at: m.createdAt,
    }));

    return NextResponse.json({ members: legacyMembers });
  } catch (error) {
    console.error('Fetch teams error:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}
