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

  // at this point, we have a valid session

  // if the user does not have an active organization, and the current path is not /dashboard, or /dashboard/account or /dashboard/organizations/create
  // redirect to /dashboard where they get prompted to choose a default organization or create a new one.
  if (
    pathname.startsWith('/dashboard') && // only apply this rule to /dashboard routes
    !['/dashboard', '/dashboard/account', '/dashboard/organizations/create', '/dashboard/usage'].includes(pathname)
  ) {
    if (!session.session.activeOrganizationId) {
      const dashboardUrl = new URL('/dashboard', url);
      return NextResponse.redirect(dashboardUrl);
    }
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

    // accepting invites requires authentication
    { source: '/invite/accept/:path*' },
  ],
};
