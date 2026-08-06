import { prisma } from './prisma';

export async function logAuditEvent(
  userId: number | null,
  action: string,
  details: string,
  ipAddress: string | null = null
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
