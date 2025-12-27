import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const config: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  logging: { fetches: { fullUrl: true } }, // allows us to see cache behavior for fetches
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // do not need image optimization yet
  },
  experimental: {
    authInterrupts: true, // needed to use forbidden() and unauthorized()
  },
  async headers() {
    return [
      // security headers
      {
        source: '/(.*)', // applies to all routes
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }, // 1 year
          {
            // "*.js.stripe.com" and "maps.googleapis.com" allow Stripe.js to improve performance by starting frames on different origins, where possible
            // https://docs.stripe.com/security/guide#content-security-policy
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              img-src 'self' data: https:;
              script-src 'self' 'unsafe-inline' https://*.vercel-scripts.com https://vercel.live https://*.js.stripe.com https://js.stripe.com https://maps.googleapis.com;
              style-src 'self' 'unsafe-inline';
              font-src 'self';
              connect-src 'self' https://*.vercel-scripts.com https://api.stripe.com https://maps.googleapis.com;
              frame-src https://vercel.live https://*.js.stripe.com https://js.stripe.com https://hooks.stripe.com;
              frame-ancestors 'none';
              object-src 'none';
              `
              .replace(/\n/g, ' ')
              .trim(),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'paklo.app' }],
        destination: `https://www.paklo.app/:path*`,
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX();
export default withWorkflow(withMDX(config));
