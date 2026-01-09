import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsBody, DocsPage, PageLastUpdate } from '@/components/docs';
import { Markdown } from '@/components/markdown';
import { Separator } from '@/components/ui/separator';
import { docs, getPageImage } from '@/lib/fumadocs';

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
    <DocsPage toc={doc.data.toc} full={doc.data.full} tableOfContent={{ style: 'clerk' }}>
      <h1 className='text-3xl font-semibold'>{doc.data.title}</h1>
      <p className='text-lg text-fd-muted-foreground mb-2'>{doc.data.description}</p>
      <Separator />
      <DocsBody>
        <Markdown body={body} source={docs} page={doc} />
        <Separator />
        {doc.data.lastModified && <PageLastUpdate date={doc.data.lastModified} />}
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return docs.generateParams();
}
