import { type NextRequest, NextResponse, type ProxyConfig } from 'next/server';
import { auth } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const session = await auth.api.getSession({ headers });

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  headers.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ headers });
}

export const config: ProxyConfig = {
  matcher: [
    { source: '/dashboard/:path*' }, // Match all /dashboard routes
  ],
};
