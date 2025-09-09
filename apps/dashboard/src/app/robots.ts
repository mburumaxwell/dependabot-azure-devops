import type { MetadataRoute } from 'next';
import { config } from '@/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: ['*'] }],
    host: config.siteUrl,
  };
}
