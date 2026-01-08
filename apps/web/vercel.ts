import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  crons: [
    {
      path: '/api/crons/cleanup/database',
      schedule: '0 2 * * *',
    },
    // {
    //   path: '/api/crons/trigger-update-jobs',
    //   schedule: '*/30 * * * *',
    // },
    // {
    //   path: '/api/crons/trigger-sync-projects',
    //   schedule: '23 */6 * * *',
    // },
    // {
    //   path: '/api/crons/trigger-scan-vulnerabilities',
    //   schedule: '0 12 * * *',
    // },
  ],
  ignoreCommand: 'node vercel-ignore-step.js',
  git: {
    deploymentEnabled: {
      'dependabot/*': false,
    },
  },
  github: {
    autoJobCancelation: true,
  },
};
