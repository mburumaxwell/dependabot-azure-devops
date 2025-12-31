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
    <nav className='border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center gap-8'>
            <Link href='/' className='text-xl font-semibold flex align-middle gap-2'>
              <PakloLogo className='size-6' />
              Paklo
            </Link>
            <div className='hidden md:flex items-center gap-6'>
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <MobileMenuSheet links={links} />
          <div className='hidden md:flex items-center gap-4'>
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
    { name: 'GitHub', href: socials.github.repo, icon: GitHubLogo },
    { name: 'Twitter', href: socials.twitter.url, icon: TwitterLogo },
    { name: 'LinkedIn', href: socials.linkedin.url, icon: LinkedInLogo },
  ];

  async function getCurrentYear() {
    return new Date().getFullYear();
  }

  return (
    <footer className='border-t border-border/40 py-8 bg-muted/10'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid md:grid-cols-3 md:gap-8 mb-4'>
          <div className='space-y-4 flex flex-col items-start order-last md:order-first'>
            <Link href='/' className='flex align-middle gap-2 invisible md:visible'>
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
                  className='mr-4 last:mr-0 hover:text-foreground transition-colors'
                >
                  <span className='sr-only'>{link.name}</span>
                  <link.icon className='size-4' />
                </a>
              ))}
            </div>
            <ThemeToggle />
            <Separator className='mt-2' />
            <p className='text-sm text-muted-foreground'>&copy; {await getCurrentYear()} Paklo. All rights reserved.</p>
          </div>
          <div className='grid grid-cols-2 gap-8 md:col-span-2 order-first md:order-last'>
            {columns.map((column) => (
              <div key={column.name}>
                <h3 className='font-semibold mb-3'>{column.name}</h3>
                <ul className='space-y-3 text-sm text-muted-foreground'>
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className='hover:text-foreground transition-colors'>
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
