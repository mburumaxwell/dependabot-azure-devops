// this is an API route instead of a page route because we cannot have the same route
// with and without an extension. This route is reached through a rewrite in `next.config.ts`
import { type NextRequest, NextResponse } from 'next/server';

import { docs, getLLMText } from '@/lib/source';

type RequestProps = {
  params: Promise<{ slug: string[] }>;
};

export async function GET(_request: NextRequest, props: RequestProps) {
  const params = await props.params;
  const post = docs.getPage(params.slug);
  if (!post) {
    return new NextResponse('Post not found', { status: 404 });
  }

  const content = await getLLMText(post);
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}

export function generateStaticParams() {
  return docs
    .getPages()
    .filter((doc) => doc.slugs.length > 0) // exclude root docs page
    .map((doc) => ({ slug: doc.slugs }));
}
