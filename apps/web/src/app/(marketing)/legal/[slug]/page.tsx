import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from '@/components/markdown';
import { TimeAgo } from '@/components/time-ago';
import { legal } from '@/lib/fumadocs';

export async function generateMetadata(props: PageProps<'/legal/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = legal.getPage([slug]);
  if (!doc) return notFound();

  return {
    title: doc.data.title,
    description: doc.data.description,
    openGraph: { url: doc.url },
  };
}

export default async function LegalDocPage(props: PageProps<'/legal/[slug]'>) {
  const { slug } = await props.params;
  const doc = legal.getPage([slug]);
  if (!doc) return notFound();

  const body = doc.data.body;

  return (
    <article>
      <div className='py-4 sm:py-8'>
        <h1 className='mt-5 text-center font-bold font-display text-2xl leading-[1.15] sm:text-4xl sm:leading-[1.15]'>
          {doc.data.title}
        </h1>
        <div className='mt-5 w-full items-center justify-center gap-2 text-center md:flex'>
          <p>
            Published <TimeAgo value={doc.data.published} />
          </p>
          <span className='hidden md:block'>&nbsp;•&nbsp;</span>
          {doc.data.lastModified && (
            <p>
              Last updated <TimeAgo value={doc.data.lastModified} />
            </p>
          )}
        </div>
      </div>
      <div className='mx-auto max-w-(--breakpoint-lg) p-4 sm:py-8 lg:px-20'>
        <Markdown body={body} source={legal} page={doc} />
      </div>
    </article>
  );
}

export function generateStaticParams() {
  return legal.getPages().map((doc) => ({ slug: doc.slugs[0] }));
}
