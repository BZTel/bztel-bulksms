import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: Request) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured on this server (missing GOOGLE_CLIENT_ID)' },
      { status: 500 }
    );
  }

  // Get application base URL dynamically or fallback to env variable
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  const { searchParams } = new URL(req.url);
  const acceptedTerms = searchParams.get('acceptedTerms') === 'true';

  // CSRF protection: bind this OAuth attempt to a nonce stored in a short-lived httpOnly
  // cookie, verified against the returned `state` param in the callback before any session
  // is created.
  const nonce = crypto.randomBytes(24).toString('hex');

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.append('client_id', googleClientId);
  oauthUrl.searchParams.append('redirect_uri', redirectUri);
  oauthUrl.searchParams.append('response_type', 'code');
  oauthUrl.searchParams.append('scope', 'openid email profile');
  oauthUrl.searchParams.append('access_type', 'offline');
  oauthUrl.searchParams.append('prompt', 'select_account');
  oauthUrl.searchParams.append('state', JSON.stringify({ nonce, acceptedTerms }));

  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.redirect(oauthUrl.toString());
  response.headers.append(
    'Set-Cookie',
    `oauth_state=${nonce}; Path=/; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Lax; Max-Age=600`
  );
  return response;
}
