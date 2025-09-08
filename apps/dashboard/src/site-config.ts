import { getSiteUrl } from '@paklo/cli/environment';

const siteUrl = getSiteUrl({ defaultValue: 'https://app.paklo.software' });

const siteConfig = {
  siteUrl: siteUrl,
  description: 'Dependabot-like automation on Azure DevOps',
};

export default siteConfig;
