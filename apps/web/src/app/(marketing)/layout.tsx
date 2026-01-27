import type { Route } from 'next';
import Link from 'next/link';
import { GitHubLogo, LinkedInLogo, PakloLogo, TwitterLogo } from '@/components/logos';
import { ThemeToggle } from '@/components/theme';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { socials } from '@/site-config';
import { type HeaderLink, MobileMenuSheet } from './layout.client';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className='min-h-screen bg-background'>
      <Header />
      {children}
      <Footer />
    </div>
  );
}

function Header() {
  const links: HeaderLink[] = [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Docs', href: '/docs' },
  ];

  return (
    <nav className='sticky top-0 z-50 border-border/40 border-b bg-background/80 backdrop-blur-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center gap-8'>
            <Link href='/' className='flex gap-2 align-middle font-semibold text-xl'>
              <PakloLogo className='size-6' />
              Paklo
            </Link>
            <div className='hidden items-center gap-6 md:flex'>
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className='text-muted-foreground text-sm transition-colors hover:text-foreground'
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <MobileMenuSheet links={links} />
          <div className='hidden items-center gap-4 md:flex'>
            <Link href='/login'>
              <Button variant='ghost' size='sm'>
                Log in
              </Button>
            </Link>
            <Link href='/signup'>
              <Button size='sm' variant='brand'>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

async function Footer() {
  type FooterColumn = {
    name: string;
    links: { name: string; href: Route | Route<'/docs'> | Route<`/legal/${string}`> }[];
  };
  const columns: FooterColumn[] = [
    {
      name: 'Product',
      links: [
        { name: 'Features', href: '/#features' },
        { name: 'Pricing', href: '/#pricing' },
        { name: 'Compare', href: '/compare' },
        { name: 'Documentation', href: '/docs' },
      ],
    },
    {
      name: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/legal/privacy' },
        { name: 'Terms of Service', href: '/legal/terms' },
      ],
    },
  ];

  const socialLinks = [
    { name: 'GitHub', href: socials.github.url, icon: GitHubLogo },
    { name: 'Twitter', href: socials.twitter.url, icon: TwitterLogo },
    { name: 'LinkedIn', href: socials.linkedin.url, icon: LinkedInLogo },
  ];

  // https://nextjs.org/docs/messages/next-prerender-current-time-client#cache-the-time-in-a-server-component
  async function getCurrentYear() {
    'use cache';
    return new Date().getFullYear();
  }

  return (
    <footer className='border-border/40 border-t bg-muted/10 py-8'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-4 grid md:grid-cols-3 md:gap-8'>
          <div className='order-last flex flex-col items-start space-y-4 md:order-first'>
            <Link href='/' className='invisible flex gap-2 align-middle md:visible'>
              <PakloLogo className='size-6' />
              Paklo
            </Link>
            <div className='flex flex-row'>
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mr-4 transition-colors last:mr-0 hover:text-foreground'
                >
                  <span className='sr-only'>{link.name}</span>
                  <link.icon className='size-4' />
                </a>
              ))}
            </div>
            <ThemeToggle />
            <Separator className='mt-2' />
            <p className='text-muted-foreground text-sm'>&copy; {await getCurrentYear()} Paklo. All rights reserved.</p>
          </div>
          <div className='order-first grid grid-cols-2 gap-8 md:order-last md:col-span-2'>
            {columns.map((column) => (
              <div key={column.name}>
                <h3 className='mb-3 font-semibold'>{column.name}</h3>
                <ul className='space-y-3 text-muted-foreground text-sm'>
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className='transition-colors hover:text-foreground'>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
