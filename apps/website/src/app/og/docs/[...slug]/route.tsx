import { generate as DefaultImage } from 'fumadocs-ui/og';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { docs, getPageImage } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const doc = docs.getPage(slug.slice(0, -1));
  if (!doc) notFound();

  return new ImageResponse(
    <DefaultImage title={doc.data.title} description={doc.data.description} site='Paklo Docs' />,
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return docs.getPages().map((doc) => ({
    lang: doc.locale,
    slug: getPageImage(doc).segments,
  }));
}
