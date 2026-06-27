import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = Number(id);
    const { amount } = await req.json();

    if (amount === undefined || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'A numeric amount is required' }, { status: 400 });
    }

    const adj = Number(amount);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.isAdmin) {
        throw new Error('CUSTOMER_NOT_FOUND');
      }

      const balanceBefore = user.balance;
      const balanceAfter = Math.max(0, balanceBefore + adj);

      // Update balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      });

      // Log transaction
      const txType = adj >= 0 ? 'admin_credit' : 'admin_debit';
      const txDesc = adj >= 0
        ? `Admin credit — ${Math.abs(adj).toLocaleString()} credits added`
        : `Admin debit — ${Math.abs(adj).toLocaleString()} credits removed`;

      await tx.transaction.create({
        data: {
          userId,
          type: txType,
          amount: adj,
          balanceBefore,
          balanceAfter,
          description: txDesc,
        },
      });

      return {
        balanceAfter,
      };
    });

    const action = adj >= 0 ? 'added' : 'deducted';
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Audit Log
    await logAuditEvent(
      authUser.id, 
      'ADMIN_CREDIT_ADJUSTMENT', 
      `Admin adjusted user ID ${userId} balance by ${adj}. New balance: ${result.balanceAfter}`, 
      clientIp
    );

    return NextResponse.json({
      message: `Successfully ${action} ${Math.abs(adj)} credits.`,
      new_balance: result.balanceAfter,
    });
  } catch (error: any) {
    if (error.message === 'CUSTOMER_NOT_FOUND') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    console.error('Admin adjust credits error:', error);
    return NextResponse.json({ error: 'Failed to adjust credits' }, { status: 500 });
  }
}
