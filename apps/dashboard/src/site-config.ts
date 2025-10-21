import { getSiteUrl } from '@paklo/core/environment';

const siteUrl = getSiteUrl({ defaultValue: 'https://dashboard.paklo.app' });

const websiteUrl = 'https://www.paklo.app';

export const config = {
  siteUrl,
  websiteUrl,
  themeColor: '#2E6417',
  title: 'Paklo Dashboard',
  description: 'Dependabot-like automation on Azure DevOps',
  legal: {
    terms: `${websiteUrl}/legal/terms`,
    privacy: `${websiteUrl}/legal/privacy`,
  },
};

export type SiteConfig = typeof config;

export { socials } from '@paklo/core/shared-data';
