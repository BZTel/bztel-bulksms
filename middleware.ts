import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // 1. Admin route protection
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
    const token = getTokenFromRequest(req);
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized: Authentication token missing' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/', req.url));
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
