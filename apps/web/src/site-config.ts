import { environment, getSiteUrl } from '@/lib/environment';

const { development, main } = environment;
const siteUrl = getSiteUrl({ defaultValue: 'https://www.paklo.app' });

export const config = {
  siteUrl,
  themeColor: '#2E6417',
  title: 'Paklo',
  description: 'Dependabot-like automation on Azure DevOps',

  // either in development or not on main branch
  showDrafts: development || !main,

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
  linkedin: {
    username: 'maxwellweru',
    url: 'https://www.linkedin.com/in/maxwellweru',
  },
  youtube: {
    channel: 'mburumaxwell',
    url: 'https://youtube.com/c/mburumaxwell',
  },
  github: {
    username: 'mburumaxwell',
    url: 'https://github.com/mburumaxwell',
  },
};
