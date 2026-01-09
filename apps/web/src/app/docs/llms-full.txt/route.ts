import { docs, getLLMFullText } from '@/lib/fumadocs';

export async function GET() {
  const scan = docs.getPages().map(getLLMFullText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}
