import { rehypeCodeDefaultOptions, remarkAdmonition, remarkSteps } from 'fumadocs-core/mdx-plugins';
import { defineCollections, defineConfig, defineDocs, metaSchema } from 'fumadocs-mdx/config';
import remarkEmoji from 'remark-emoji';

import { z } from '@/fumadocs/zod';

export const legal = defineCollections({
  type: 'doc',
  dir: 'content/legal',
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
    schema: ({ path, source }) =>
      z.object({
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
        full: z.boolean().optional(),
        git: z.git({ path }),
        keywords: z.string().array().default([]),
        draft: z.boolean().default(false),
        readtime: z.readtime({ contents: source }),
      }),
  },
  meta: { schema: metaSchema },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      lazy: true,
      experimentalJSEngine: true,
      inline: 'tailing-curly-colon',
      themes: {
        light: 'catppuccin-latte', // 'github-light',
        dark: 'catppuccin-mocha', // 'github-dark',
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        {
          name: 'transformers:remove-notation-escape',
          code(hast: any) {
            for (const line of hast.children) {
              if (line.type !== 'element') continue;

              const lastSpan = line.children.findLast((v: any) => v.type === 'element');

              const head = lastSpan?.children[0];
              if (head?.type !== 'text') return;

              head.value = head.value.replace(/\[\\!code/g, '[!code');
            }
          },
        },
      ],
    },
    remarkPlugins: [remarkAdmonition, remarkEmoji, remarkSteps],
  },
});
