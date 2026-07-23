import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

// PATCH update service request status (Admin only)
export async function PATCH(
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
    const requestId = Number(id);

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid Request ID' }, { status: 400 });
    }

    const { status } = await req.json();

    if (!status || !['Reviewing', 'Approved', 'Declined'].includes(status)) {
      return NextResponse.json({ error: 'Status must be one of: "Reviewing", "Approved", "Declined"' }, { status: 400 });
    }

    const existing = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    let updated;
    
    // Check if we are approving a manual Bank Transfer request
    const isApprovingBankTransfer = 
      existing.serviceType === 'Bank Transfer' && 
      status === 'Approved' && 
      existing.status !== 'Approved';

    if (isApprovingBankTransfer) {
      // Parse credits from description: e.g. "Bank Transfer verification request. Credits: 5000 | Reference: BZ-1-168"
      const creditsMatch = existing.description.match(/Credits:\s*(\d+)/i);
      const creditsToLoad = creditsMatch ? parseInt(creditsMatch[1], 10) : 0;

      if (creditsToLoad <= 0) {
        return NextResponse.json({ error: 'Could not parse a valid credits amount from the request description' }, { status: 400 });
      }

      updated = await prisma.$transaction(async (tx) => {
        // Fetch current user balance
        const user = await tx.user.findUnique({
          where: { id: existing.userId },
          select: { balance: true }
        });

        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        const balanceBefore = user.balance;
        const balanceAfter = balanceBefore + creditsToLoad;

        // Credit user balance
        await tx.user.update({
          where: { id: existing.userId },
          data: { balance: balanceAfter }
        });

        // Write purchase transaction log
        await tx.transaction.create({
          data: {
            userId: existing.userId,
            type: 'purchase',
            amount: creditsToLoad,
            balanceBefore,
            balanceAfter,
            description: `Bank Transfer Top-Up — ${creditsToLoad.toLocaleString()} SMS Credits`,
          }
        });

        // Update request status
        return await tx.serviceRequest.update({
          where: { id: requestId },
          data: { status }
        });
      });
    } else {
      updated = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status }
      });
    }

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAuditEvent(
      updated.userId,
      'ADMIN_SERVICE_REQUEST_UPDATE',
      `Admin updated service request ID ${requestId} (${updated.serviceType}) status to: ${updated.status}`,
      clientIp
    );

    return NextResponse.json({
      message: `Service request successfully updated to ${status}`,
      request: {
        id: updated.id,
        status: updated.status,
        serviceType: updated.serviceType,
        repName: updated.repName,
      }
    });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'Customer account not found' }, { status: 404 });
    }
    console.error('Admin update service request error:', error);
    return NextResponse.json({ error: 'Failed to update custom service request' }, { status: 500 });
  }
}
