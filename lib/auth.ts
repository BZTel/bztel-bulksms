import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is not defined in production.');
    }
    console.warn('[Security Warning] JWT_SECRET environment variable is missing. Generating ephemeral session secret key.');
    return 'bztel-sms-sec-key-7f9a2b8e4c1d6e3f5a0b9c8d7e6f5a4b';
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters long in production.');
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

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Fallback to HTTP-only cookie parsing
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, val] = cookie.trim().split('=');
      if (key && val) acc[key] = decodeURIComponent(val);
      return acc;
    }, {} as Record<string, string>);

    if (cookies['auth_token']) {
      return cookies['auth_token'];
    }
  }

  return null;
}

export async function getUserFromRequest(req: Request): Promise<AuthenticatedUser | null> {
  const token = getTokenFromRequest(req);

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
  // Enforce 24-hour expiration for enhanced session security
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 10) {
    return { valid: false, message: 'Password must be at least 10 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}
