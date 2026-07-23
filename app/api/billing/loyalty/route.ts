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

    // Fetch user cached loyalty balance
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { loyaltyPoints: true }
    });

    // Fetch all loyalty ledger entries
    const ledgers = await prisma.loyaltyLedger.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedLedgers = ledgers.map(l => ({
      id: l.id,
      amount: l.amount,
      description: l.description,
      created_at: l.createdAt.toISOString()
    }));

    return NextResponse.json({
      loyalty_points: user?.loyaltyPoints || 0,
      ledgers: formattedLedgers
    });
  } catch (error) {
    console.error('Fetch loyalty logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty logs' }, { status: 500 });
  }
}
