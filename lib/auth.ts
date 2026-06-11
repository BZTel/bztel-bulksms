import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'bztel-sms-app-secret-key-12345';

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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; is_admin: boolean };
    
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
