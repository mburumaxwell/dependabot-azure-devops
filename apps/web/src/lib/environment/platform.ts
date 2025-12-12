export type Platform = 'azure_container_apps' | 'vercel';

export function getPlatform(): Platform | undefined {
  if (process.env.CONTAINER_APP_ENV_DNS_SUFFIX) return 'azure_container_apps';
  else if (process.env.VERCEL_BRANCH_URL) return 'vercel';

  return undefined;
}
