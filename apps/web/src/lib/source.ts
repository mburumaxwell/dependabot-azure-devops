import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { createMDXSource } from 'fumadocs-mdx/runtime/next';
import { docs as allDocs, legal as allLegal } from '@/../.source';

export const legal = loader({
  baseUrl: '/legal',
  source: createMDXSource(allLegal),
});

export const docs = loader({
  baseUrl: '/docs',
  source: allDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: InferPageType<typeof docs>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof docs>) {
  return `# ${page.data.title} (${page.url})`;
}

export async function getLLMFullText(page: InferPageType<typeof docs>) {
  return `# ${page.data.title} (${page.url})\n\n${await page.data.getText('processed')}`;
}
