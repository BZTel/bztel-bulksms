import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.bztel.net';

  console.log(`[FLW Callback] Received query parameters - status: ${status} | txRef: ${txRef} | transactionId: ${transactionId}`);

  if (status !== 'successful' && status !== 'completed' || !transactionId) {
    console.warn('[FLW Callback] Payment was not successful or missing transaction ID');
    return NextResponse.redirect(`${appUrl}/app.html?view=wallet&status=error&message=Payment+was+not+successful`);
  }

  try {
    const flwSecret = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-mock-secret-key-123';

    // Call Flutterwave verification API on the server side
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: {
        'Authorization': `Bearer ${flwSecret}`,
        'Content-Type': 'application/json',
      },
    });

    const flwData = await response.json();
    console.log('[FLW Callback] Verification response:', flwData);

    if (flwData.status === 'success' && flwData.data && flwData.data.status === 'successful') {
      const verifiedTx = flwData.data;
      
      // Parse customer metadata
      const userId = Number(verifiedTx.meta.userId);
      const credits = Number(verifiedTx.meta.credits);
      const redeemPoints = verifiedTx.meta.redeemPoints === 'true';
      const pointsToRedeem = Number(verifiedTx.meta.pointsToRedeem || '0');
      const paidAmount = Number(verifiedTx.amount);

      if (isNaN(userId) || isNaN(credits) || credits <= 0) {
        console.error('[FLW Callback] Invalid metadata values in transaction:', verifiedTx.meta);
        return NextResponse.redirect(`${appUrl}/app.html?view=wallet&status=error&message=Invalid+transaction+metadata`);
      }

      // Check if transaction has already been credited (idempotency check)
      const existingTx = await prisma.transaction.findFirst({
        where: {
          description: {
            contains: `FLW-${transactionId}`,
          },
        },
      });

      if (existingTx) {
        console.log(`[FLW Callback] Transaction ${transactionId} was already processed previously`);
        return NextResponse.redirect(`${appUrl}/app.html?view=wallet&status=success&credits=${credits}&reloaded=true`);
      }

      // Execute crediting transaction
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { balance: true, loyaltyPoints: true },
        });

        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore + credits;

        let finalLoyaltyPoints = user.loyaltyPoints;

        // 1. If points were redeemed, deduct them
        if (redeemPoints && pointsToRedeem > 0) {
          const actualRedeem = Math.min(finalLoyaltyPoints, pointsToRedeem);
          finalLoyaltyPoints -= actualRedeem;

          await tx.loyaltyLedger.create({
            data: {
              userId,
              amount: -actualRedeem,
              description: `Redeemed points for ₦${(actualRedeem * 100).toLocaleString()} discount on refill (Ref: FLW-${transactionId})`
            }
          });
        }

        // 2. Calculate and award earned loyalty points: 1 point per ₦1000 spent
        const pointsEarned = Math.floor(paidAmount / 1000);
        if (pointsEarned > 0) {
          finalLoyaltyPoints += pointsEarned;
          
          await tx.loyaltyLedger.create({
            data: {
              userId,
              amount: pointsEarned,
              description: `Earned points from ₦${paidAmount.toLocaleString()} refill (Ref: FLW-${transactionId})`
            }
          });
        }

        // 3. Update user balance and loyalty points
        await tx.user.update({
          where: { id: userId },
          data: { 
            balance: balanceAfter,
            loyaltyPoints: finalLoyaltyPoints
          },
        });

        // 4. Log payment transaction
        await tx.transaction.create({
          data: {
            userId,
            type: 'purchase',
            amount: credits,
            balanceBefore,
            balanceAfter,
            description: `Flutterwave Online Refill (Ref ID: FLW-${transactionId})${redeemPoints ? ` — Points Discount Applied` : ''}`,
          },
        });
      });

      console.log(`[FLW Callback] Successfully credited ${credits} credits to user ${userId}`);
      return NextResponse.redirect(`${appUrl}/app.html?view=wallet&status=success&credits=${credits}`);
    } else {
      console.error('[FLW Callback] Flutterwave transaction verification failed status:', flwData);
      return NextResponse.redirect(`${appUrl}/app.html?view=wallet&status=error&message=Verification+failed`);
    }
  } catch (error) {
    console.error('[FLW Callback] Unexpected error during verification:', error);
    return NextResponse.redirect(`${appUrl}/app.html?view=wallet&status=error&message=Internal+server+verification+error`);
  }
}
