import { getSiteUrl } from '@paklo/core/environment';

const siteUrl = getSiteUrl({ defaultValue: 'https://dashboard.paklo.app' });

export const config = {
  siteUrl,
  themeColor: '#2E6417',
  title: 'Paklo Dashboard',
  description: 'Dependabot-like automation on Azure DevOps',
};

export { socials } from '@paklo/core/shared-data';
