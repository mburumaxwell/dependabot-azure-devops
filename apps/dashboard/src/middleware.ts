import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
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
