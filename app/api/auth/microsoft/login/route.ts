import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;

  if (!microsoftClientId) {
    return NextResponse.json(
      { error: 'Microsoft OAuth is not configured on this server (missing MICROSOFT_CLIENT_ID)' },
      { status: 500 }
    );
  }

  // Get application base URL dynamically or fallback to env variable
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const redirectUri = `${appUrl}/api/auth/microsoft/callback`;

  const oauthUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  oauthUrl.searchParams.append('client_id', microsoftClientId);
  oauthUrl.searchParams.append('redirect_uri', redirectUri);
  oauthUrl.searchParams.append('response_type', 'code');
  oauthUrl.searchParams.append('response_mode', 'query');
  oauthUrl.searchParams.append('scope', 'openid email profile User.Read');
  oauthUrl.searchParams.append('prompt', 'select_account');

  return NextResponse.redirect(oauthUrl.toString());
}
