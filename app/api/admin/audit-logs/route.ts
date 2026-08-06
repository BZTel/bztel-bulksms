import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    const formattedLogs = logs.map((l) => ({
      id: l.id,
      user_id: l.userId,
      email: l.user?.email || 'System',
      action: l.action,
      details: l.details,
      ip_address: l.ipAddress || '127.0.0.1',
      created_at: l.createdAt.toISOString(),
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error('Fetch admin audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
