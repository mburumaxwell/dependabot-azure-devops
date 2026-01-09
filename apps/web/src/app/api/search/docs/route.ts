import { createFromSource, docs } from '@/lib/fumadocs';

export const { GET } = createFromSource(docs, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});
