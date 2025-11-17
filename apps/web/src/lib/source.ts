import { docs as allDocs, legal as allLegal } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';

export const legal = loader(toFumadocsSource(allLegal, []), {
  baseUrl: '/legal',
});

export const docs = loader(allDocs.toFumadocsSource(), {
  baseUrl: '/docs',
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

// TODO: remove this after the issue is fixed:
// https://github.com/fuma-nama/fumadocs/issues/2629
export function correctLastModified(value?: Date) {
  if (!value) return undefined;
  if (typeof value === 'number') return new Date(value);
  return value;
}
