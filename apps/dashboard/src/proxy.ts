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
     * 04. /api/crons (cron jobs)
     * 05. /signup (obviously)
     * 06. /login (obviously)
     * 07. /admin/usage (only for me)
     * 08. /_next/ (Next.js internals)
     * 09. /_static (inside /public)
     * 10. /_vercel (Vercel internals)
     * 11. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
     */
    '/((?!api/update_jobs/|api/usage-telemetry|api/auth|api/crons|signup|login|admin/usage|_next/|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};
