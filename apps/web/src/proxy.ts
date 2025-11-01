import { type NextRequest, NextResponse, type ProxyConfig } from 'next/server';
import { auth } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const session = await auth.api.getSession({ headers });
  const { nextUrl: url } = request;
  const { pathname } = url;

  if (!session) {
    const loginUrl = new URL('/login', url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Make modified headers available upstream not to clients. Using
  // next({ headers }) instead of next({ request: { headers } })
  // makes server actions to fail so make sure to edit the request headers.
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#setting-headers
  headers.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers } });
}

export const config: ProxyConfig = {
  matcher: [
    { source: '/dashboard/:path*' }, // Match all /dashboard routes
  ],
};
