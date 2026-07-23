import { NextResponse } from 'next/server';
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

    const creditsNum = Number(credits);
    let amountInNgn = 0;

    // Map packages to costs
    if (creditsNum === 1000) {
      amountInNgn = 15000;
    } else if (creditsNum === 5000) {
      amountInNgn = 60000;
    } else if (creditsNum === 25000) {
      amountInNgn = 225000;
    } else {
      amountInNgn = creditsNum * 12; // Fallback NGN 12 per credit
    }

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
    } else {
      console.error('[FLW Initialize] Flutterwave payment generation failed:', flwData);
      return NextResponse.json({ error: flwData.message || 'Failed to initialize payment session' }, { status: 400 });
    }
  } catch (error) {
    console.error('[FLW Initialize] Server error:', error);
    return NextResponse.json({ error: 'Internal server error initializing payment' }, { status: 500 });
  }
}
