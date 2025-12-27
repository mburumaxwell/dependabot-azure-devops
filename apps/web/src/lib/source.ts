import { docs as allDocs, legal as allLegal } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader, type Page } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';

export const legal = loader(toFumadocsSource(allLegal, []), {
  baseUrl: '/legal',
});

export const docs = loader(allDocs.toFumadocsSource(), {
  baseUrl: '/docs',
  plugins: [lucideIconsPlugin()],
});

type PageImage = { segments: string[]; url: string };
export function getPageImage(page: InferPageType<typeof legal>): PageImage;
export function getPageImage(page: InferPageType<typeof docs>): PageImage;
export function getPageImage(page: Page): PageImage {
  const collection = docs.getPage(page.slugs) ? 'docs' : 'legal';
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/${collection}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof docs>) {
  return `# ${page.data.title} (${page.url})`;
}

export async function getLLMFullText(page: InferPageType<typeof docs>) {
  return `# ${page.data.title} (${page.url})\n\n${await page.data.getText('processed')}`;
}
