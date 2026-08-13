import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

// Approving a service request can trigger a real balance credit (manual Bank Transfer
// requests), so "Approved" cannot be a blanket updateMany — each row is processed
// individually, replicating the exact logic in app/api/admin/services/[id]/route.ts.
async function approveOne(requestId: number, clientIp: string) {
  const existing = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!existing) return { requestId, ok: false, error: 'Service request not found' };
  if (existing.status === 'Approved') return { requestId, ok: true, skipped: true };

  const isBankTransfer = existing.serviceType === 'Bank Transfer';

  let updated;
  if (isBankTransfer) {
    const creditsMatch = existing.description.match(/Credits:\s*(\d+)/i);
    const creditsToLoad = creditsMatch ? parseInt(creditsMatch[1], 10) : 0;

    if (creditsToLoad <= 0) {
      return { requestId, ok: false, error: 'Could not parse a valid credits amount from the request description' };
    }

    try {
      updated = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: existing.userId },
          select: { balance: true, loyaltyPoints: true },
        });
        if (!user) throw new Error('USER_NOT_FOUND');

        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore + creditsToLoad;
        let finalLoyaltyPoints = user.loyaltyPoints;

        const pointsMatch = existing.description.match(/RedeemedPoints:\s*(\d+)/i);
        const pointsToRedeem = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;

        if (pointsToRedeem > 0) {
          const actualRedeem = Math.min(finalLoyaltyPoints, pointsToRedeem);
          finalLoyaltyPoints -= actualRedeem;
          await tx.loyaltyLedger.create({
            data: {
              userId: existing.userId,
              amount: -actualRedeem,
              description: `Redeemed points for ₦${(actualRedeem * 100).toLocaleString()} discount on refill (Request ID: ${requestId})`,
            },
          });
        }

        let pointsEarned = 0;
        if (creditsToLoad === 1000) pointsEarned = 15;
        else if (creditsToLoad === 5000) pointsEarned = 60;
        else if (creditsToLoad === 25000) pointsEarned = 225;
        else pointsEarned = Math.floor((creditsToLoad * 12) / 1000);

        if (pointsEarned > 0) {
          finalLoyaltyPoints += pointsEarned;
          await tx.loyaltyLedger.create({
            data: {
              userId: existing.userId,
              amount: pointsEarned,
              description: `Earned points from Custom Service top-up (Request ID: ${requestId})`,
            },
          });
        }

        await tx.user.update({
          where: { id: existing.userId },
          data: { balance: balanceAfter, loyaltyPoints: finalLoyaltyPoints },
        });

        await tx.transaction.create({
          data: {
            userId: existing.userId,
            type: 'purchase',
            amount: creditsToLoad,
            balanceBefore,
            balanceAfter,
            description: `Bank Transfer Top-Up — ${creditsToLoad.toLocaleString()} SMS Credits${pointsToRedeem > 0 ? ' (Points Discount Applied)' : ''}`,
          },
        });

        return tx.serviceRequest.update({ where: { id: requestId }, data: { status: 'Approved' } });
      });
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        return { requestId, ok: false, error: 'Customer account not found' };
      }
      throw err;
    }
  } else {
    updated = await prisma.serviceRequest.update({ where: { id: requestId }, data: { status: 'Approved' } });
  }

  await logAuditEvent(
    updated.userId,
    'ADMIN_SERVICE_REQUEST_UPDATE',
    `Admin updated service request ID ${requestId} (${updated.serviceType}) status to: Approved`,
    clientIp
  );

  return { requestId, ok: true };
}

export async function PATCH(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { ids, status } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty ids list' }, { status: 400 });
    }
    if (!status || !['Reviewing', 'Approved', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Status must be one of: "Reviewing", "Approved", "Declined"' }, { status: 400 });
    }

    const numericIds = ids.map(Number);
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (status === 'Approved') {
      // Process sequentially — each row may credit real money, so failures on one
      // request must not block or roll back the others.
      const results = [];
      for (const id of numericIds) {
        results.push(await approveOne(id, clientIp));
      }
      const succeeded = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok);

      return NextResponse.json({
        message: `${succeeded} of ${numericIds.length} service request(s) approved${failed.length ? `, ${failed.length} failed` : ''}`,
        count: succeeded,
        failures: failed,
      });
    }

    const updated = await prisma.serviceRequest.updateMany({
      where: { id: { in: numericIds } },
      data: { status },
    });

    await logAuditEvent(
      authUser.id,
      'ADMIN_SERVICE_REQUEST_UPDATE',
      `Admin bulk-updated ${updated.count} service request(s) to status: ${status} (IDs: ${numericIds.join(', ')})`,
      clientIp
    );

    return NextResponse.json({
      message: `${updated.count} service request(s) updated to ${status}`,
      count: updated.count,
    });
  } catch (error) {
    console.error('Admin bulk update service requests error:', error);
    return NextResponse.json({ error: 'Failed to bulk update service requests' }, { status: 500 });
  }
}
