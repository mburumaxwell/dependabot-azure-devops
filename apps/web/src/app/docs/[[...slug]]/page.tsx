import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from '@/components/markdown';
import { docs, getPageImage } from '@/lib/source';

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = docs.getPage(slug);
  if (!doc) return notFound();

  return {
    title: doc.data.title,
    description: doc.data.description,
    keywords: doc.data.keywords,
    openGraph: {
      url: doc.url,
      images: getPageImage(doc).url,
    },
  };
}

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await props.params;
  const doc = docs.getPage(slug);
  if (!doc) return notFound();

  const body = doc.data.body;

  return (
    <DocsPage toc={doc.data.toc} full={doc.data.full}>
      <DocsTitle>{doc.data.title}</DocsTitle>
      <DocsDescription>{doc.data.description}</DocsDescription>
      <DocsBody>
        <Markdown body={body} source={docs} page={doc} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return docs.generateParams();
}
