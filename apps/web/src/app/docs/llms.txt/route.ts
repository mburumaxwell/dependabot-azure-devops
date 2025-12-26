import { docs, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = docs.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(`# Paklo

## Docs

${scanned.join('\n\n')}`);
}
