import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Markdown } from '@/components/markdown';
import { legal } from '@/lib/source';
import { formatDate } from '@/lib/utils';

export async function generateMetadata(props: PageProps<'/legal/[slug]'>): Promise<Metadata> {
  const params = await props.params;
  const doc = legal.getPage([params.slug]);
  if (!doc) {
    notFound();
  }

  return {
    title: doc.data.title,
    openGraph: { url: doc.url },
  };
}

export default async function LegalDocPage(props: PageProps<'/legal/[slug]'>) {
  const params = await props.params;
  const doc = legal.getPage([params.slug]);
  if (!doc) {
    notFound();
  }

  return (
    <article>
      <div className='py-16 sm:py-32'>
        <h1 className='font-display mt-5 text-center text-3xl leading-[1.15] font-bold sm:text-5xl sm:leading-[1.15]'>
          {doc.data.title}
        </h1>
        {doc.data.updated && (
          <div className='mt-5 w-full text-center'>
            <p>Last updated on {formatDate(doc.data.updated)}</p>
          </div>
        )}
      </div>
      <div className='mx-auto flex w-full max-w-(--breakpoint-lg) flex-col items-center p-10 px-2.5 sm:pt-20 lg:px-20'>
        <Markdown body={doc.data.body} />
      </div>
    </article>
  );
}

export function generateStaticParams() {
  return legal.getPages().map((doc) => ({ slug: doc.slugs[0] }));
}
