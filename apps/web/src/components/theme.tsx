'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme,
    setTheme,
    resolvedTheme,
    mounted,
    isDark: mounted ? resolvedTheme === 'dark' : false,
    isLight: mounted ? resolvedTheme === 'light' : false,
    isSystem: theme === 'system',
  };
}

/** Theme selection component using a dropdown select. */
export function ThemeSelect() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button variant='outline' size='sm'>
        <Sun className='size-4' />
      </Button>
    );
  }

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className='w-fit'>
        <SelectValue>
          {theme === 'light' && <Sun className='size-4' />}
          {theme === 'dark' && <Moon className='size-4' />}
          {theme === 'system' && <Monitor className='size-4' />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='light' aria-label='Light'>
          <div className='flex items-center gap-2'>
            <Sun className='size-4' />
            Light
          </div>
        </SelectItem>
        <SelectItem value='dark' aria-label='Dark'>
          <div className='flex items-center gap-2'>
            <Moon className='size-4' />
            Dark
          </div>
        </SelectItem>
        <SelectItem value='system' aria-label='System'>
          <div className='flex items-center gap-2'>
            <Monitor className='size-4' />
            System
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

/** Theme toggle component using a button that cycles through themes. */
export function ThemeButton() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button variant='outline' size='sm'>
        <Sun className='size-4' />
      </Button>
    );
  }

  function cycleTheme() {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  }

  return (
    <Button variant='outline' size='sm' onClick={cycleTheme}>
      {theme === 'light' && <Sun className='size-4' />}
      {theme === 'dark' && <Moon className='size-4' />}
      {theme === 'system' && <Monitor className='size-4' />}
    </Button>
  );
}

/** Theme toggle component using a toggle group. */
export function ThemeToggle() {
  const { setTheme, theme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button variant='outline' size='sm'>
        <Sun className='size-4' />
      </Button>
    );
  }

  return (
    <ToggleGroup type='single' variant='outline' size='sm' value={theme} onValueChange={setTheme}>
      <ToggleGroupItem value='light' aria-label='Light'>
        <Sun />
      </ToggleGroupItem>
      <ToggleGroupItem value='dark' aria-label='Dark'>
        <Moon />
      </ToggleGroupItem>
      <ToggleGroupItem value='system' aria-label='System'>
        <Monitor />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
