import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: Request) {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error param:', error);
      return NextResponse.redirect(`${appUrl}/app?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/app?error=Missing+authorization+code`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Google Client credentials in env');
      return NextResponse.redirect(`${appUrl}/app?error=Server+configuration+error`);
    }

    // Exchange authorization code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Error exchanging Google OAuth code:', tokenData);
      return NextResponse.redirect(`${appUrl}/app?error=Failed+to+exchange+authorization+code`);
    }

    const { access_token } = tokenData;

    // Fetch user profile from Google info endpoint
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error('Error fetching Google user profile:', profileData);
      return NextResponse.redirect(`${appUrl}/app?error=Failed+to+retrieve+profile+information`);
    }

    const { email } = profileData;

    if (!email) {
      return NextResponse.redirect(`${appUrl}/app?error=Email+not+provided+by+Google`);
    }

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Check if suspended
      if (user.status === 'suspended') {
        await logAuditEvent(user.id, 'LOGIN_SUSPENDED', `Attempted social login to suspended account: ${email}`, clientIp);
        return NextResponse.redirect(`${appUrl}/app?error=Account+is+suspended`);
      }
      
      await logAuditEvent(user.id, 'LOGIN_SUCCESS', `User logged in via Google OAuth: ${email}`, clientIp);
    } else {
      // Register new user via Google
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash: null, // Social login users do not need a password
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
            description: 'Account signup (Google) — welcome bonus credits',
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

      await logAuditEvent(user.id, 'SIGNUP_SUCCESS', `Account registered successfully via Google OAuth: ${email}`, clientIp);
    }

    // Create JWT
    const token = generateToken({ id: user.id, email: user.email, is_admin: user.isAdmin });

    // Redirect to app with JWT in query
    return NextResponse.redirect(`${appUrl}/app?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('Google OAuth callback handler error:', error);
    return NextResponse.redirect(`${appUrl}/app?error=Internal+server+error+during+OAuth+login`);
  }
}
