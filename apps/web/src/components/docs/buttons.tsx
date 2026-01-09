'use client';

import { Check, Copy, Edit } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useCopyButton } from '@/hooks/use-copy-button';
import { cn } from '@/lib/utils';

const cache = new Map<string, string>();

type CopyMarkdownButtonProps = {
  url: string;
} & Omit<React.ComponentPropsWithoutRef<'button'>, 'onClick' | 'disabled'>;
export function CopyMarkdownButton({ url, className, ...props }: CopyMarkdownButtonProps) {
  const [isLoading, setLoading] = React.useState(false);
  const [checked, onClick] = useCopyButton(async () => {
    const cached = cache.get(url);
    if (cached) return navigator.clipboard.writeText(cached);

    setLoading(true);

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': fetch(url).then(async (res) => {
            const content = await res.text();
            cache.set(url, content);

            return content;
          }),
        }),
      ]);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Button
      disabled={isLoading}
      size='sm'
      variant='outline'
      className={cn('text-xs gap-2', className)}
      onClick={onClick}
      {...props}
    >
      {checked ? <Check /> : <Copy />}
      Copy Markdown
    </Button>
  );
}

export function EditOnGitHub({ className, ...props }: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <a target='_blank' rel='noreferrer noopener' {...props}>
      <Button size='sm' variant='outline' className={cn('text-xs gap-2 not-prose', className)}>
        <Edit />
        Edit on GitHub
      </Button>
    </a>
  );
}
