import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { authRateLimiter } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Enforce strict rate limiting (5 attempts per 15 min per IP)
    const rateLimit = await authRateLimiter(clientIp);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.reset - Math.floor(Date.now() / 1000)),
          },
        }
      );
    }

    const { email, password } = await req.json();

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Valid email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await logAuditEvent(null, 'LOGIN_FAILURE', `Invalid login attempt for email: ${normalizedEmail}`, clientIp);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if suspended
    if (user.status === 'suspended') {
      await logAuditEvent(user.id, 'LOGIN_SUSPENDED', `Attempted login to suspended account: ${normalizedEmail}`, clientIp);
      return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      await logAuditEvent(user.id, 'LOGIN_FAILURE', `Failed password attempt for email: ${normalizedEmail}`, clientIp);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    let finalStatus = user.status;

    // Auto-activate pending coworkers on successful first login
    if (user.status.toLowerCase() === 'pending') {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'active' },
      });
      finalStatus = 'active';
      await logAuditEvent(user.id, 'COWORKER_ACTIVATION', `Coworker account activated upon first successful login: ${normalizedEmail}`, clientIp);
    }

    // Create 24h JWT token
    const token = generateToken({ id: user.id, email: user.email, is_admin: user.isAdmin });

    await logAuditEvent(user.id, 'LOGIN_SUCCESS', `User logged in successfully`, clientIp);

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance,
        role: user.role,
        isAdmin: user.isAdmin,
        mustChangePassword: user.mustChangePassword,
      }
    });

    // Set secure HTTP-only session cookie (24 hour expiration)
    response.headers.append(
      'Set-Cookie',
      `auth_token=${token}; Path=/; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred during authentication' }, { status: 500 });
  }
}
