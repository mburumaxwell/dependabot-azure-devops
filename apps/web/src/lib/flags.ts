import { flag } from 'flags/next';

export const enableEnterpriseTier = flag({
  key: 'enable-enterprise-tier',
  defaultValue: false,
  decide() {
    // return Math.random() > 0.5;
    return false;
  },
});

export const enableDependabotDebug = flag({
  key: 'enable-dependabot-debug',
  defaultValue: false,
  decide() {
    return false;
  },
});

// Add more feature flags here as needed
