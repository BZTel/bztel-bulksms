import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // 1. Admin API route protection. The /admin page itself is a static shell
  // (public/admin.html) with its own login form, so it must stay reachable
  // without a token; actual admin data is gated per-route via
  // getUserFromRequest + is_admin checks in app/api/admin/*.
  if (pathname.startsWith('/api/admin')) {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Authentication token missing' }, { status: 401 });
    }
  }

  // 2. Block suspicious user-agent or dangerous header injections
  const userAgent = req.headers.get('user-agent') || '';
  if (/sqlmap|nikto|dirbuster|nmap|acunetix|w3af/i.test(userAgent)) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  const response = NextResponse.next();
  response.headers.set('X-Request-IP', ip);
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
  ],
};
