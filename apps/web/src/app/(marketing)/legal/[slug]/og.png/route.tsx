import { notFound } from 'next/navigation';
import { generateOpenGraphImage } from '@/components/og-image';
import { legal } from '@/lib/fumadocs';
import { config } from '@/site-config';

export async function GET(_req: Request, props: RouteContext<'/legal/[slug]/og.png'>) {
  const { slug } = await props.params;
  const doc = legal.getPage([slug]);
  if (!doc) return notFound();

  return generateOpenGraphImage({
    title: doc.data.title,
    description: doc.data.description,
    site: config.title,
    size: { width: 1200, height: 630 },
  });
}

export function generateStaticParams() {
  return legal.getPages().map((doc) => ({ slug: doc.slugs[0] }));
}
