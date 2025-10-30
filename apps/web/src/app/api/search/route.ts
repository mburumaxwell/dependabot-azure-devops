import { createFromSource } from 'fumadocs-core/search/server';
import { docs } from '@/lib/source';

export const { GET } = createFromSource(docs, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
});
