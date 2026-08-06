import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// GET services requests
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = authUser.owner_id;

    const requests = await prisma.serviceRequest.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });

    // Map to snake_case structure compatible with original frontend
    const legacyRequests = requests.map((r) => ({
      id: r.id,
      user_id: r.userId,
      service_type: r.serviceType,
      rep_name: r.repName,
      phone: r.phone,
      description: r.description,
      status: r.status,
      created_at: r.createdAt,
    }));

    return NextResponse.json({ requests: legacyRequests });
  } catch (error) {
    console.error('Fetch service requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch custom service requests' }, { status: 500 });
  }
}

// POST create service request
export async function POST(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceType, repName, phone, description } = await req.json();
    const ownerId = authUser.owner_id;

    if (!serviceType || !repName || !phone || !description) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const request = await prisma.serviceRequest.create({
      data: {
        userId: ownerId,
        serviceType,
        repName: repName.trim(),
        phone: phone.trim(),
        description: description.trim(),
        status: 'Reviewing',
      },
    });

    return NextResponse.json({
      message: 'Custom service request submitted successfully',
      request: {
        id: request.id,
        serviceType: request.serviceType,
        repName: request.repName,
        phone: request.phone,
        description: request.description,
        status: request.status,
        created_at: request.createdAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create service request error:', error);
    return NextResponse.json({ error: 'Failed to submit custom service request' }, { status: 500 });
  }
}
