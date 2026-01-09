import defaultMdxComponents, { createRelativeLink } from 'fumadocs-ui/mdx';
import { generate as DefaultImage } from 'fumadocs-ui/og';

export { DefaultImage };
export { defaultMdxComponents, createRelativeLink };

export { DocsLayout } from 'fumadocs-ui/layouts/notebook';
export { DocsBody, DocsPage, PageLastUpdate } from 'fumadocs-ui/layouts/notebook/page';
export { RootProvider } from 'fumadocs-ui/provider/next';

export * from './buttons';
export * from './feedback';
