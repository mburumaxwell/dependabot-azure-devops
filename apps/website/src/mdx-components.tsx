import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // a: ({ href = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    //   if (href.startsWith('/') || href.startsWith('#')) {
    //     return <Link href={href as Route} {...props} />;
    //   }

    //   return <a href={href} target='_blank' rel='noopener noreferrer' {...props} />;
    // },
    // img: ({ className, alt, ...props }: ImageProps) => {
    //   return <Image className={cn('rounded-md border', className)} alt={alt} {...props} />;
    // },
    ...components,
  };
}
