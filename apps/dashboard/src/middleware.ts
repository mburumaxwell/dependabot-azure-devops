import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/update_jobs/ routes
     * 2. /api/usage-telemetry (public usage telemetry endpoint)
     * 3. /admin/usage (only for me)
     * 4. /_next/ (Next.js internals)
     * 5. /_static (inside /public)
     * 6. /_vercel (Vercel internals)
     * 7. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
     */
    '/((?!api/update_jobs/|api/usage-telemetry|admin/usage|_next/|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};
