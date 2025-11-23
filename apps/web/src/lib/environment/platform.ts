export type Platform = 'azure_container_apps' | 'vercel' | undefined;

export function getPlatform(): Platform {
  if (process.env.CONTAINER_APP_ENV_DNS_SUFFIX) return 'azure_container_apps';
  else if (process.env.VERCEL_BRANCH_URL) return 'vercel';

  return undefined;
}
