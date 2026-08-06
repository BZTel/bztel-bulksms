import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credits } = await req.json();
    if (!credits || isNaN(credits) || Number(credits) <= 0) {
      return NextResponse.json({ error: 'Valid credits amount is required' }, { status: 400 });
    }

    const ownerId = authUser.owner_id;
    const creditsNum = Number(credits);

    const updatedOwner = await prisma.$transaction(async (tx) => {
      // Pull current balance of owner
      const owner = await tx.user.findUnique({
        where: { id: ownerId },
        select: { balance: true },
      });

      if (!owner) {
        throw new Error('Owner not found');
      }

      const balanceBefore = owner.balance;
      const balanceAfter = balanceBefore + creditsNum;

      // Update owner balance
      const updated = await tx.user.update({
        where: { id: ownerId },
        data: { balance: balanceAfter },
      });

      // Write purchase transaction under owner's ID
      await tx.transaction.create({
        data: {
          userId: ownerId,
          type: 'purchase',
          amount: creditsNum,
          balanceBefore,
          balanceAfter,
          description: `Credit Top-Up — ${creditsNum.toLocaleString()} SMS Credits`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: `Successfully added ${creditsNum} credits to your account!`,
      balance: updatedOwner.balance
    });
  } catch (error) {
    console.error('Topup error:', error);
    return NextResponse.json({ error: 'Failed to process topup' }, { status: 500 });
  }
}
