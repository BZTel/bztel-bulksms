import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET all service requests (Admin only)
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const requests = await prisma.serviceRequest.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      user_id: r.userId,
      email: r.user.email,
      service_type: r.serviceType,
      rep_name: r.repName,
      phone: r.phone,
      description: r.description,
      status: r.status,
      created_at: r.createdAt,
    }));

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error('Admin fetch service requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch custom service requests' }, { status: 500 });
  }
}
