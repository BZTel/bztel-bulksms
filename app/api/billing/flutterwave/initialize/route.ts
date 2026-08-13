import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeExpectedNgnAmount } from '@/lib/pricing';

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credits, redeemPoints } = await req.json();
    if (!credits || isNaN(credits) || Number(credits) <= 0) {
      return NextResponse.json({ error: 'Valid credits amount is required' }, { status: 400 });
    }

    const creditsNum = Number(credits);
    const amountInNgn = computeExpectedNgnAmount(creditsNum);
    const pointsToRedeem = 0;
    const discount = 0;

    const flwSecret = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-mock-secret-key-123';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.bztel.net';
    const txRef = `bztel-flw-${authUser.owner_id}-${Date.now()}`;

    console.log(`[FLW Initialize] Initiating payment for user ${authUser.owner_id}. Ref: ${txRef} | NGN ${amountInNgn}`);

    // Call Flutterwave Standard Payment endpoint
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flwSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amountInNgn,
        currency: 'NGN',
        redirect_url: `${appUrl}/api/billing/flutterwave/callback`,
        meta: {
          userId: authUser.owner_id,
          credits: creditsNum,
          redeemPoints: redeemPoints ? 'true' : 'false',
          pointsToRedeem: String(pointsToRedeem),
          discount: String(discount),
        },
        customer: {
          email: authUser.email,
          name: authUser.email.split('@')[0],
        },
        customizations: {
          title: 'BZTel SMS Platform',
          description: `Refill SMS Credits (${creditsNum.toLocaleString()} Credits)`,
          logo: 'https://www.bztel.net/bztel-site-logo.svg',
        },
      }),
    });

    const flwData = await response.json();
    console.log('[FLW Initialize] Response received:', flwData);

    if (flwData.status === 'success' && flwData.data && flwData.data.link) {
      return NextResponse.json({ link: flwData.data.link });
    } else if (flwSecret.includes('mock') || !process.env.FLW_SECRET_KEY) {
      console.warn('[FLW Initialize] Unconfigured secret key detected in dev environment; returning demo checkout URL.');
      const mockLink = `${appUrl}/api/billing/flutterwave/callback?status=success&credits=${creditsNum}&tx_ref=${txRef}`;
      return NextResponse.json({ link: mockLink });
    } else {
      console.error('[FLW Initialize] Flutterwave payment generation failed:', flwData);
      return NextResponse.json({ error: flwData.message || 'Failed to initialize payment session' }, { status: 400 });
    }
  } catch (error) {
    console.error('[FLW Initialize] Server error:', error);
    return NextResponse.json({ error: 'Internal server error initializing payment' }, { status: 500 });
  }
}
