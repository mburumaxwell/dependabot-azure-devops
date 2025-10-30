import type { MetadataRoute } from 'next';

import { config } from '@/site-config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Paklo',
    short_name: 'Paklo',
    start_url: '/',
    background_color: '#F6F9FC',
    theme_color: config.themeColor,
    display: 'standalone',
    icons: [
      {
        src: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
