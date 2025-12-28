import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from '@/components/markdown';
import { TimeAgo } from '@/components/time-ago';
import { legal } from '@/lib/source';

export async function generateMetadata(props: PageProps<'/legal/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = legal.getPage([slug]);
  if (!doc) return notFound();

  return {
    title: doc.data.title,
    description: doc.data.description,
    openGraph: {
      url: doc.url,
      images: `${doc.url}/og.png`,
    },
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
        <h1 className='font-display mt-5 text-center text-2xl leading-[1.15] font-bold sm:text-4xl sm:leading-[1.15]'>
          {doc.data.title}
        </h1>
        <div className='mt-5 w-full md:flex gap-2 justify-center items-center text-center'>
          <p>
            Published <TimeAgo value={doc.data.published} />
          </p>
          <span className='hidden md:block'>&nbsp;•&nbsp;</span>
          <p>
            Last updated <TimeAgo value={doc.data.lastModified ?? doc.data.published} />
          </p>
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
