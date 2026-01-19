import { createHypertuneAdapter } from '@flags-sdk/hypertune';
import type { Identify } from 'flags';
import { dedupe, flag } from 'flags/next';
import {
  type Context,
  createSource,
  type FlagValues,
  vercelFlagDefinitions as flagDefinitions,
  flagFallbacks,
} from '@/../.generated/hypertune';
import { auth } from '@/lib/auth';

const ANONYMOUS_USER = { id: 'anonymous', name: 'Anonymous', email: '' };
const identify: Identify<Context> = dedupe(async ({ headers, cookies }) => {
  const user = (await auth.api.getSession({ headers }))?.user;
  return {
    environment: process.env.NODE_ENV,
    user: user ? { id: user.id, name: user.name!, email: user.email } : ANONYMOUS_USER,
  };
});

const hypertuneAdapter = createHypertuneAdapter<FlagValues, Context>({
  createSource,
  flagFallbacks,
  flagDefinitions,
  identify,
});

export const enableHomePageStats = flag(hypertuneAdapter.declarations.enableHomePageStats);

export const enableDependabotDebug = flag({
  key: 'enable-dependabot-debug',
  defaultValue: false,
  decide: () => false,
});

export const enableDependabotConnectivityCheck = flag({
  key: 'enable-dependabot-connectivity-check',
  defaultValue: Boolean(process.env.DEPENDABOT_ENABLE_CONNECTIVITY_CHECK || '1'),
  decide: () => true,
});

// Add more feature flags here as needed
