'use client';

import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

// https://github.com/fuma-nama/fumadocs/blob/e2fbe21c8aca4485ee189f3bf2a83ceb1edc336e/apps/docs/components/ai/page-actions.tsx
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
    <button
      disabled={isLoading}
      className={cn(
        buttonVariants({
          color: 'secondary',
          size: 'sm',
          className: 'gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground',
        }),
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {checked ? <Check /> : <Copy />}
      Copy Markdown
    </button>
  );
}
