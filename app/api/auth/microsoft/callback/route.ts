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
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('Microsoft OAuth error param:', error, errorDescription);
      return NextResponse.redirect(`${appUrl}/app?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/app?error=Missing+authorization+code`);
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = `${appUrl}/api/auth/microsoft/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Microsoft Client credentials in env');
      return NextResponse.redirect(`${appUrl}/app?error=Server+configuration+error`);
    }

    // Exchange authorization code for token
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
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
      console.error('Error exchanging Microsoft OAuth code:', tokenData);
      return NextResponse.redirect(`${appUrl}/app?error=Failed+to+exchange+authorization+code`);
    }

    const { access_token } = tokenData;

    // Fetch user profile from Microsoft Graph
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error('Error fetching Microsoft user profile:', profileData);
      return NextResponse.redirect(`${appUrl}/app?error=Failed+to+retrieve+profile+information`);
    }

    // Note: Microsoft Graph API can return email as 'mail' or 'userPrincipalName'
    const email = profileData.mail || profileData.userPrincipalName;

    if (!email) {
      return NextResponse.redirect(`${appUrl}/app?error=Email+not+provided+by+Microsoft`);
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
      
      await logAuditEvent(user.id, 'LOGIN_SUCCESS', `User logged in via Microsoft OAuth: ${email}`, clientIp);
    } else {
      // Register new user via Microsoft
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
            description: 'Account signup (Microsoft) — welcome bonus credits',
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

      await logAuditEvent(user.id, 'SIGNUP_SUCCESS', `Account registered successfully via Microsoft OAuth: ${email}`, clientIp);
    }

    // Create JWT
    const token = generateToken({ id: user.id, email: user.email, is_admin: user.isAdmin });

    // Redirect to app with JWT in query
    return NextResponse.redirect(`${appUrl}/app?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('Microsoft OAuth callback handler error:', error);
    return NextResponse.redirect(`${appUrl}/app?error=Internal+server+error+during+OAuth+login`);
  }
}
