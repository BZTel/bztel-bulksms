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

    const transactions = await prisma.transaction.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });

    let totalCredited = 0;
    let totalDebited = 0;

    const legacyTransactions = transactions.map((tx) => {
      if (tx.amount > 0) {
        totalCredited += tx.amount;
      } else {
        totalDebited += Math.abs(tx.amount);
      }

      // Map to snake_case format compatible with original dashboard frontend
      return {
        id: tx.id,
        user_id: tx.userId,
        type: tx.type,
        amount: tx.amount,
        balance_before: tx.balanceBefore,
        balance_after: tx.balanceAfter,
        description: tx.description,
        created_at: tx.createdAt,
      };
    });

    return NextResponse.json({
      transactions: legacyTransactions,
      summary: {
        total_credited: totalCredited,
        total_debited: totalDebited,
        count: legacyTransactions.length,
      },
    });
  } catch (error) {
    console.error('Billing transactions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction history' }, { status: 500 });
  }
}
