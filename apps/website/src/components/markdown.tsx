import { Image, type ImageProps } from 'fumadocs-core/framework';
import Link from 'fumadocs-core/link';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents, MDXProps } from 'mdx/types';
import type { Route } from 'next';
import type { AnchorHTMLAttributes, FC } from 'react';

import { cn } from '@/lib/utils';

// heading already has 'flex scroll-m-28 flex-row items-center gap-2'
const components: MDXComponents = {
  a: ({ href = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href.startsWith('/') || href.startsWith('#')) {
      return <Link href={href as Route} {...props} />;
    }

    return <a href={href} target='_blank' rel='noopener noreferrer' {...props} />;
  },
  img: ({ className, alt, ...props }: ImageProps) => {
    return <Image className={cn('rounded-md border', className)} alt={alt} {...props} />;
  },
};

export type MarkdownProps = { body: FC<MDXProps>; className?: string };

export function Markdown({ body: Mdx, className }: MarkdownProps) {
  return (
    <div className={cn('prose dark:prose-invert max-w-none', className)}>
      <Mdx components={getMDXComponents(components)} />
    </div>
  );
}

function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
  };
}
