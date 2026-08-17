import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken, validatePassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { authRateLimiter } from '@/lib/rate-limit';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Enforce strict rate limiting (5 attempts per 15 min per IP)
    const rateLimit = await authRateLimiter(clientIp);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again in 15 minutes.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.reset - Math.floor(Date.now() / 1000)),
          },
        }
      );
    }

    const body = await req.json();
    const { email, password, phone, firstName, lastName, acceptedTerms, promotionalConsent } = body;
    const fullName = (firstName && lastName)
      ? `${String(firstName).trim()} ${String(lastName).trim()}`
      : (String(body.name || '').trim());

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'First name, last name, email, and password are required' }, { status: 400 });
    }

    const trimmedPhone = String(phone || '').trim();
    if (!trimmedPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!phoneRegex.test(trimmedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    if (!acceptedTerms) {
      return NextResponse.json({ error: 'You must accept the terms and conditions' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return NextResponse.json({ error: pwdCheck.message }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      await logAuditEvent(null, 'SIGNUP_FAILURE', `Attempted to register existing email: ${normalizedEmail}`, clientIp);
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    // Hash password with 12 salt rounds
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user and transaction in a transaction to guarantee consistency
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: fullName,
          phone: trimmedPhone,
          termsAcceptedAt: new Date(),
          promotionalConsent: Boolean(promotionalConsent),
          passwordHash,
          balance: 2,
          role: 'Owner',
          status: 'active',
        },
      });

      await tx.transaction.create({
        data: {
          userId: newUser.id,
          type: 'signup_bonus',
          amount: 2,
          balanceBefore: 0,
          balanceAfter: 2,
          description: 'Account signup — welcome bonus credits',
        },
      });

      // Assign a default unique virtual number (for receiving replies)
      const randomPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      await tx.virtualNumber.create({
        data: {
          userId: newUser.id,
          number: randomPhone,
          status: 'active',
        },
      });

      return newUser;
    });

    // Create 24h JWT
    const token = generateToken({ id: result.id, email: normalizedEmail, is_admin: false });

    // Write audit log
    await logAuditEvent(result.id, 'SIGNUP_SUCCESS', `Account registered successfully for ${normalizedEmail}`, clientIp);

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        token,
        user: {
          id: result.id,
          email: normalizedEmail,
          balance: result.balance,
        },
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.headers.append(
      'Set-Cookie',
      `auth_token=${token}; Path=/; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 });
  }
}
