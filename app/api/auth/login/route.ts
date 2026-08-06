import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await logAuditEvent(null, 'LOGIN_FAILURE', `Invalid login attempt for email: ${email}`, clientIp);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if suspended
    if (user.status === 'suspended') {
      await logAuditEvent(user.id, 'LOGIN_SUSPENDED', `Attempted login to suspended account: ${email}`, clientIp);
      return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      await logAuditEvent(user.id, 'LOGIN_FAILURE', `Failed password attempt for email: ${email}`, clientIp);
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
      await logAuditEvent(user.id, 'COWORKER_ACTIVATION', `Coworker account activated upon first successful login: ${email}`, clientIp);
    }

    // Create JWT token
    const token = generateToken({ id: user.id, email: user.email, is_admin: user.isAdmin });

    await logAuditEvent(user.id, 'LOGIN_SUCCESS', `User logged in successfully`, clientIp);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
