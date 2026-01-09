import { notFound } from 'next/navigation';
import { generateOpenGraphImage } from '@/components/og-image';
import { docs, getPageImage } from '@/lib/fumadocs';
import { config } from '@/site-config';

export async function GET(_req: Request, props: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await props.params;
  const doc = docs.getPage(slug.slice(0, -1));
  if (!doc) return notFound();

  return generateOpenGraphImage({
    title: doc.data.title,
    description: doc.data.description,
    site: config.docs.title,
  });
}

export function generateStaticParams() {
  return docs.getPages().map((doc) => ({
    lang: doc.locale,
    slug: getPageImage(doc).segments,
  }));
}
