import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storeFeedback } from '@/actions/feedback';
import { CopyMarkdownButton, DocsBody, DocsPage, EditOnGitHub, Feedback, PageLastUpdate } from '@/components/docs';
import { Markdown } from '@/components/markdown';
import { Separator } from '@/components/ui/separator';
import type { SubmitFeedback } from '@/lib/feedback';
import { docs, getPageImage } from '@/lib/fumadocs';
import { config } from '@/site-config';

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
  const rawUrl = ['/docs/raw', ...doc.slugs].filter(Boolean).join('/');

  // can't simplify this function any further due to server/client boundaries
  async function handleFeedback(feedback: SubmitFeedback) {
    'use server';
    return await storeFeedback({ type: 'docs.review', ...feedback });
  }

  return (
    <DocsPage toc={doc.data.toc} full={doc.data.full} tableOfContent={{ style: 'clerk' }}>
      <h1 className='font-semibold text-3xl'>{doc.data.title}</h1>
      <p className='mb-2 text-fd-muted-foreground text-lg'>{doc.data.description}</p>
      <div className='flex flex-row flex-wrap items-center gap-2'>
        <CopyMarkdownButton url={rawUrl} />
        <EditOnGitHub href={`${config.github.repo_url}/blob/main/apps/web/content/docs/${doc.path}`} />
      </div>
      <Separator />
      <DocsBody>
        <Markdown body={body} source={docs} page={doc} />
        <Separator className='my-2' />
        <Feedback onSendAction={handleFeedback} />
        <Separator className='my-2' />
        {doc.data.lastModified && <PageLastUpdate date={doc.data.lastModified} />}
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return docs.generateParams();
}
