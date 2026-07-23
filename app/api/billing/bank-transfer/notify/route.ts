import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credits, reference } = await req.json();

    if (!credits || isNaN(credits) || Number(credits) <= 0) {
      return NextResponse.json({ error: 'Valid credits amount is required' }, { status: 400 });
    }
    if (!reference || reference.trim() === '') {
      return NextResponse.json({ error: 'Payment reference code is required' }, { status: 400 });
    }

    const creditsNum = Number(credits);
    const cleanRef = reference.trim();
    const ownerId = authUser.owner_id;

    console.log(`[Bank Transfer Notify] User ${ownerId} notified of NGN transfer for ${creditsNum} credits. Ref: ${cleanRef}`);

    // Create a ServiceRequest for manual admin review
    const request = await prisma.serviceRequest.create({
      data: {
        userId: ownerId,
        serviceType: 'Bank Transfer',
        repName: authUser.email,
        phone: 'Manual',
        description: `Bank Transfer verification request. Credits: ${creditsNum} | Reference: ${cleanRef}`,
        status: 'Reviewing',
      },
    });

    return NextResponse.json({
      message: 'Bank transfer notification submitted successfully! The administrator will verify and credit your account shortly.',
      requestId: request.id,
    });
  } catch (error) {
    console.error('[Bank Transfer Notify] Server error:', error);
    return NextResponse.json({ error: 'Failed to process bank transfer notification' }, { status: 500 });
  }
}
