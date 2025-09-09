import { environment, getSiteUrl } from '@paklo/cli/environment';

const { development, main } = environment;
const siteUrl = getSiteUrl({ defaultValue: 'https://www.paklo.app' });

export const config = {
  siteUrl,
  themeColor: '#264C3F', // TODO: update this to match actual
  title: 'Paklo',
  description: 'Dependabot-like automation on Azure DevOps',

  // either in development or not on main branch
  showDrafts: development || !main,
};

export { socials } from '@paklo/cli/shared-data';
