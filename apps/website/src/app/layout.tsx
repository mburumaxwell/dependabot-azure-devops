import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata, Viewport } from 'next';
import type { TemplateString } from 'next/dist/lib/metadata/types/metadata-types';
import { Inter } from 'next/font/google';

import './globals.css';

import { config, socials } from '@/site-config';

const titleTemplate: TemplateString = {
  default: config.title,
  template: `%s | ${config.title}`,
};

export const metadata: Metadata = {
  title: titleTemplate,
  description: config.description,
  metadataBase: new URL(config.siteUrl),
  openGraph: {
    type: 'website',
    title: titleTemplate,
    description: config.description,
    url: config.siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    creator: `@${socials.twitter.username}`,
    site: `@${socials.twitter.username}`,
  },
};

export const viewport: Viewport = {
  themeColor: config.themeColor,
  width: 'device-width',
  initialScale: 1,
};

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en' className={inter.className} suppressHydrationWarning>
      <body className='flex flex-col min-h-screen'>
        <RootProvider>{children}</RootProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
