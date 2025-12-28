import { environment, getSiteUrl } from '@/lib/environment';

const { development, main } = environment;
const siteUrl = getSiteUrl({ defaultValue: 'https://www.paklo.app' });

export const config = {
  siteUrl,
  domain: 'paklo.app',
  themeColor: 'oklch(0.4494 0.1221 138.11)', // '#2E6417',
  title: 'Paklo',
  description: 'Dependabot-like automation on Azure DevOps',

  // either in development or not on main branch
  showDrafts: development || !main,

  docs: {
    title: 'Paklo Docs',
    description: 'Documentation for Paklo - Dependabot-like automation on Azure DevOps',
  },

  dashboard: {
    title: 'Paklo Dashboard',
  },
};

// just me, for now
export const socials = {
  twitter: {
    username: 'maxwellweru',
    url: 'https://twitter.com/maxwellweru',
  },
  github: {
    username: 'mburumaxwell',
    url: 'https://github.com/mburumaxwell',
    repo: 'https://github.com/mburumaxwell/dependabot-azure-devops',
  },
  linkedin: {
    username: 'maxwellweru',
    url: 'https://www.linkedin.com/in/maxwellweru/',
  },
};

export const extensions = {
  azure: {
    id: 'tingle-software.dependabot',
    url: 'https://marketplace.visualstudio.com/items?itemName=tingle-software.dependabot',
  },
};
