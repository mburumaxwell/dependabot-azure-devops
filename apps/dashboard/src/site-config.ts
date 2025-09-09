import { getSiteUrl } from '@paklo/cli/environment';

const siteUrl = getSiteUrl({ defaultValue: 'https://app.paklo.software' });

export const config = {
  siteUrl,
  themeColor: '#264C3F', // TODO: update this to match actual
  title: 'Paklo Dashboard',
  description: 'Dependabot-like automation on Azure DevOps',
};

export { socials } from '@paklo/cli/shared-data';
