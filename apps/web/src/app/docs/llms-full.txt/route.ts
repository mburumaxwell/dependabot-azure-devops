import { docs, getLLMFullText } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = docs.getPages().map(getLLMFullText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}
