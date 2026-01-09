import { docs, getLLMFullText } from '@/lib/fumadocs';

export async function GET(_req: Request, props: RouteContext<'/docs/raw/[[...slug]]'>) {
  const params = await props.params;
  const doc = docs.getPage(params.slug);
  if (!doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }

  const content = await getLLMFullText(doc);
  return new Response(content);
}

export async function generateStaticParams() {
  return docs.generateParams();
}
