import { notFound } from 'next/navigation';
import { generateOpenGraphImage } from '@/components/og-image';
import { getPageImage, legal } from '@/lib/source';
import { config } from '@/site-config';

export async function GET(_req: Request, props: RouteContext<'/og/legal/[...slug]'>) {
  const { slug } = await props.params;
  const doc = legal.getPage(slug.slice(0, -1));
  if (!doc) return notFound();

  return generateOpenGraphImage({
    title: doc.data.title,
    description: doc.data.description,
    site: config.title,
  });
}

export function generateStaticParams() {
  return legal.getPages().map((doc) => ({
    lang: doc.locale,
    slug: getPageImage(doc).segments,
  }));
}
