'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export function ThemeToggle() {
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
        <SelectItem value='light'>
          <div className='flex items-center gap-2'>
            <Sun className='size-4' />
            Light
          </div>
        </SelectItem>
        <SelectItem value='dark'>
          <div className='flex items-center gap-2'>
            <Moon className='size-4' />
            Dark
          </div>
        </SelectItem>
        <SelectItem value='system'>
          <div className='flex items-center gap-2'>
            <Monitor className='size-4' />
            System
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// Alternative simpler button version
export function ThemeToggleButton() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button variant='outline' size='sm'>
        <Sun className='size-4' />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <Button variant='outline' size='sm' onClick={cycleTheme}>
      {theme === 'light' && <Sun className='size-4' />}
      {theme === 'dark' && <Moon className='size-4' />}
      {theme === 'system' && <Monitor className='size-4' />}
    </Button>
  );
}
