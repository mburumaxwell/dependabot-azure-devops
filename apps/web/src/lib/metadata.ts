import type { Metadata } from 'next';
import type { TemplateString } from 'next/dist/lib/metadata/types/metadata-types';
import { config, socials } from '@/site-config';

const rootTitleTemplate: TemplateString = {
  default: config.title,
  template: `%s | ${config.title}`,
};

export const defaultMetadata: Metadata = {
  title: rootTitleTemplate,
  description: config.description,
  metadataBase: new URL(config.siteUrl),
  keywords: config.keywords,
  openGraph: {
    type: 'website',
    title: rootTitleTemplate,
    description: config.description,
    url: config.siteUrl,
    siteName: config.name,
  },
  twitter: {
    card: 'summary_large_image',
    creator: `@${socials.twitter.username}`,
    site: `@${socials.twitter.username}`,
  },
};

const docsTitleTemplate: TemplateString = {
  default: config.docs.title,
  template: `%s | ${config.docs.title}`,
};

export const docsMetadata: Metadata = {
  ...defaultMetadata,
  title: docsTitleTemplate,
  description: config.docs.description,
  openGraph: {
    ...defaultMetadata.openGraph,
    title: docsTitleTemplate,
    description: config.docs.description,
  },
};

const dashboardTitleTemplate: TemplateString = {
  default: config.dashboard.title,
  template: `%s | ${config.dashboard.title}`,
};

export const dashboardMetadata: Metadata = {
  ...defaultMetadata,
  title: dashboardTitleTemplate,
  openGraph: {
    ...defaultMetadata.openGraph,
    title: dashboardTitleTemplate,
  },
};
