import { NextResponse } from 'next/server';

export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ message: 'Logged out' });
  response.headers.append(
    'Set-Cookie',
    `auth_token=; Path=/; HttpOnly; ${isProd ? 'Secure;' : ''} SameSite=Lax; Max-Age=0`
  );
  return response;
}
