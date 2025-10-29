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
  matcher: [
    /*
     * Match all paths except for:
     * 01. /api/update_jobs/ routes
     * 02. /api/usage-telemetry (public usage telemetry endpoint)
     * 03. /api/auth (obviously)
     * 04. /signup (obviously)
     * 05. /login (obviously)
     * 06. /admin/usage (only for me)
     * 07. /_next/ (Next.js internals)
     * 08. /_static (inside /public)
     * 09. /_vercel (Vercel internals)
     * 10. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
     */
    '/((?!api/update_jobs/|api/usage-telemetry|api/auth|signup|login|admin/usage|_next/|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};
