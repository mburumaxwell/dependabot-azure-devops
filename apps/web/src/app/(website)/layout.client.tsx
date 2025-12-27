'use client';

import { Menu } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export type HeaderLink = { name: string; href: Route | Route<'/docs'> };

export function MobileMenuSheet({ links }: { links: HeaderLink[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className='md:hidden'>
        <Button variant='ghost' size='icon'>
          <Menu className='size-5' />
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-64 p-4'>
        <div className='flex flex-col gap-6 mt-8'>
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              onClick={() => setOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className='border-t border-border pt-6 flex flex-col gap-3'>
            <Link href='/login' onClick={() => setOpen(false)}>
              <Button variant='ghost' size='sm' className='w-full justify-start'>
                Log in
              </Button>
            </Link>
            <Link href='/signup' onClick={() => setOpen(false)}>
              <Button size='sm' variant='brand' className='w-full'>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
