interface SiteUrlOptions {
  /** Whether the current environment is development. */
  development: boolean;

  /** Whether the current branch is the main branch. */
  main: boolean;

  /** The default URL to use if no other URL is found. */
  defaultValue: string;
}

/**
 * Get the site URL based on the environment variables.
 * @param options - The options to use.
 * @returns The site URL.
 */
export function getSiteUrlCombined({ development, main, defaultValue }: SiteUrlOptions) {
  // if we are in development, use localhost
  if (development) return `http://localhost:${process.env.PORT || 3000}`;

  // if we are on the main branch, use the known URL
  if (main) return defaultValue;

  // if we are on Azure ContainerApps, use the provided URL
  let value = getSiteUrlForAca();
  if (value && value.length > 0) return value;

  // if we are on Vercel, use the provided URL
  value = process.env.VERCEL_BRANCH_URL;
  if (value && value.length > 0) return `https://${value}`;

  return defaultValue; // fallback (edge cases)
}

export function getSiteUrlForAca(): string | undefined {
  /*
   * Having looked at the available ENV variables when deployed, we can form the URL from
   * combinations of the following variables:
   * CONTAINER_APP_ENV_DNS_SUFFIX (e.g. "jollyplant-9349db20.westeurope.azurecontainerapps.io")
   * CONTAINER_APP_NAME (e.g. "paklo-website")
   */

  const suffix = process.env.CONTAINER_APP_ENV_DNS_SUFFIX;
  const name = process.env.CONTAINER_APP_NAME;
  if (!suffix || !name) return undefined;
  return `https://${name}.${suffix}`;
}
