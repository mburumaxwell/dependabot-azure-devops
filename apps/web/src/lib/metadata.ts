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
  openGraph: {
    type: 'website',
    title: rootTitleTemplate,
    description: config.description,
    url: config.siteUrl,
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
  title: docsTitleTemplate,
  description: config.docs.description,
  metadataBase: new URL(config.siteUrl),
  openGraph: {
    type: 'website',
    title: docsTitleTemplate,
    description: config.docs.description,
    url: config.siteUrl,
  },
};

const dashboardTitleTemplate: TemplateString = {
  default: config.dashboard.title,
  template: `%s | ${config.dashboard.title}`,
};

export const dashboardMetadata: Metadata = {
  title: dashboardTitleTemplate,
  description: config.description,
  metadataBase: new URL(config.siteUrl),
  openGraph: {
    type: 'website',
    title: dashboardTitleTemplate,
    description: config.description,
    url: config.siteUrl,
  },
};
