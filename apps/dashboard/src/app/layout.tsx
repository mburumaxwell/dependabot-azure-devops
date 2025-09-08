import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Inter } from 'next/font/google';

import '@/app/global.css';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en' className={inter.className} suppressHydrationWarning>
      <body className='flex flex-col min-h-screen'>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
