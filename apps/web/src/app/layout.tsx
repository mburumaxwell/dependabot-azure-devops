import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Viewport } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from '@/components/theme';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { config } from '@/site-config';

import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export { defaultMetadata as metadata } from '@/lib/metadata';

export const viewport: Viewport = {
  themeColor: config.themeColor,
  width: 'device-width',
  initialScale: 1,
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en' className={geist.className} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
