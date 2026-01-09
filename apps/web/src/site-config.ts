import { environment, getSiteUrl } from '@/lib/environment';

const { development, main } = environment;
const siteUrl = getSiteUrl({ defaultValue: 'https://www.paklo.app' });

export const config = {
  siteUrl,
  name: 'Paklo',
  domain: 'paklo.app',
  themeColor: 'oklch(0.4494 0.1221 138.11)', // '#2E6417',
  title: 'Paklo',
  description: 'Dependabot-like dependency updates for Azure DevOps — automated PRs and scheduling',
  keywords: [
    'paklo',
    'dependabot',
    'azure devops',
    'dependabot azure devops',
    'security',
    'automation',
    'devops',
    'software development',
    'code security',
    'package management',
    'devops tools',
    'dependency updates',
    'vulnerability management',
    'devops automation',
  ],

  // either in development or not on main branch
  showDrafts: development || !main,

  docs: {
    title: 'Paklo Docs',
    description: 'Documentation for Paklo - Dependabot-like automation on Azure DevOps',
  },

  dashboard: {
    title: 'Paklo Dashboard',
  },

  github: {
    owner: 'mburumaxwell',
    repo: 'paklo',
    repo_url: 'https://github.com/mburumaxwell/paklo',
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
    url: 'https://github.com/mburumaxwell/paklo',
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
