import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { Prisma } from '@prisma/client';

function isSecurityAction(action: string): boolean {
  const secActions = ['USER_SUSPENDED', 'ADMIN_USER_SUSPEND', 'ADMIN_USER_REACTIVATE', 'SUSPEND'];
  return secActions.includes(action) || action.includes('SUSPEND');
}

function isAdminAction(action: string): boolean {
  return action.startsWith('ADMIN_') && !action.includes('SUSPEND') && !action.includes('REACTIVATE');
}

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!authUser.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    // Category (security/admin/system) is a classification of the `action` string, not a
    // real DB column — resolve it once against the distinct action list (cheap) and reuse
    // both for the platform-wide stats and to scope the main paginated query.
    const actionCounts = await prisma.auditLog.groupBy({ by: ['action'], _count: { _all: true } });

    const stats = { total: 0, security: 0, admin: 0, system: 0 };
    const actionsByCategory: Record<'security' | 'admin' | 'system', string[]> = {
      security: [],
      admin: [],
      system: [],
    };
    for (const c of actionCounts) {
      const count = c._count._all || 0;
      stats.total += count;
      if (isSecurityAction(c.action)) {
        stats.security += count;
        actionsByCategory.security.push(c.action);
      } else if (isAdminAction(c.action)) {
        stats.admin += count;
        actionsByCategory.admin.push(c.action);
      } else {
        stats.system += count;
        actionsByCategory.system.push(c.action);
      }
    }

    const where: Prisma.AuditLogWhereInput = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (category === 'security' || category === 'admin' || category === 'system') {
      where.action = { in: actionsByCategory[category] };
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
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
        skip,
        take: limit,
      }),
    ]);

    const formattedLogs = logs.map((l) => ({
      id: l.id,
      user_id: l.userId,
      email: l.user?.email || 'System',
      action: l.action,
      details: l.details,
      ip_address: l.ipAddress || '127.0.0.1',
      created_at: l.createdAt.toISOString(),
    }));

    return NextResponse.json({
      logs: formattedLogs,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Fetch admin audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
