import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!passwordRegex.test(password)) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).' 
      }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await logAuditEvent(null, 'SIGNUP_FAILURE', `Attempted to register existing email: ${email}`, clientIp);
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user and transaction in a transaction to guarantee consistency
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          balance: 100,
          role: 'Owner',
          status: 'active',
        },
      });

      await tx.transaction.create({
        data: {
          userId: newUser.id,
          type: 'signup_bonus',
          amount: 100,
          balanceBefore: 0,
          balanceAfter: 100,
          description: 'Account signup — welcome bonus credits',
        },
      });

      return newUser;
    });

    // Create JWT
    const token = generateToken({ id: result.id, email, is_admin: false });

    // Write audit log
    await logAuditEvent(result.id, 'SIGNUP_SUCCESS', `Account registered successfully for ${email}`, clientIp);

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        email,
        balance: 100
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
