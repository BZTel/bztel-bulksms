import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is not defined in production.');
    }
    console.warn('[Security Warning] JWT_SECRET environment variable is missing. Using development fallback key.');
    return 'bztel-sms-dev-secret-key-change-in-production';
  }
  return secret;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  is_admin: boolean;
  role: string;
  owner_id: number;
}

export async function getUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: number; email: string; is_admin: boolean };
    
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, isAdmin: true, status: true, role: true, parentUserId: true }
    });

    if (!dbUser || dbUser.status === 'suspended') {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      is_admin: dbUser.isAdmin,
      role: dbUser.role || 'Owner',
      owner_id: dbUser.parentUserId || dbUser.id,
    };
  } catch (err) {
    return null;
  }
}

export function generateToken(payload: { id: number; email: string; is_admin: boolean }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}
