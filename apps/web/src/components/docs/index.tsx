import defaultMdxComponents, { createRelativeLink } from 'fumadocs-ui/mdx';
import { generate as DefaultImage } from 'fumadocs-ui/og';

export { DefaultImage };
export { defaultMdxComponents, createRelativeLink };

export { DocsLayout } from 'fumadocs-ui/layouts/docs';
export { DocsBody, DocsPage, EditOnGitHub, PageLastUpdate } from 'fumadocs-ui/page';
export { RootProvider } from 'fumadocs-ui/provider/next';

export * from './copy-markdown';
