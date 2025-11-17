import { rehypeCodeDefaultOptions, remarkDirectiveAdmonition, remarkSteps } from 'fumadocs-core/mdx-plugins';
import { defineCollections, defineConfig, defineDocs, metaSchema } from 'fumadocs-mdx/config';
import lastModified from 'fumadocs-mdx/plugins/last-modified';
import remarkEmoji from 'remark-emoji';

import { z } from 'zod';

export const legal = defineCollections({
  type: 'doc',
  dir: 'content/legal',
  postprocess: {
    includeProcessedMarkdown: true,
  },
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    full: z.boolean().optional(),
    updated: z.coerce.date(),
  }),
});

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
      full: z.boolean().optional(),
      keywords: z.string().array().default([]),
      draft: z.boolean().default(false),
    }),
  },
  meta: { schema: metaSchema },
});

export default defineConfig({
  plugins: [lastModified()],
  mdxOptions: {
    rehypeCodeOptions: {
      lazy: true,
      inline: 'tailing-curly-colon',
      themes: {
        light: 'catppuccin-latte', // 'github-light',
        dark: 'catppuccin-mocha', // 'github-dark',
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        {
          name: 'transformers:remove-notation-escape',
          code(hast) {
            for (const line of hast.children) {
              if (line.type !== 'element') continue;

              const lastSpan = line.children.findLast((v) => v.type === 'element');

              const head = lastSpan?.children[0];
              if (head?.type !== 'text') return;

              head.value = head.value.replace(/\[\\!code/g, '[!code');
            }
          },
        },
      ],
    },
    remarkPlugins: [remarkDirectiveAdmonition, remarkEmoji, remarkSteps],
  },
});
