import { type NextRequest, NextResponse } from 'next/server';
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

export const config = {
  // TODO: change to only match /dashboard/:path* after admin is incorporated into auth system
  matcher: [
    /*
     * Match all dashboard paths except for:
     * /admin/usage (only for me, handles its own auth for now)
     */
    '/((?!admin/usage$)dashboard/.*)',
  ],
};
