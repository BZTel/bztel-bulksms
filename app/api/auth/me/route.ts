import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        balance: true,
        role: true,
        parentUserId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Resolve shared wallet balance for team coworkers
    const ownerId = user.parentUserId || user.id;
    let balance = user.balance;

    if (user.parentUserId) {
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { balance: true },
      });
      if (owner) {
        balance = owner.balance;
      }
    }

    // Transform to snake_case format compatible with original frontend
    const legacyUserObject = {
      id: user.id,
      email: user.email,
      balance,
      role: user.role,
      parent_user_id: user.parentUserId,
    };

    return NextResponse.json({ user: legacyUserObject });
  } catch (error) {
    console.error('Fetch me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
