import { flag } from 'flags/next';

export const enableEnterpriseTier = flag({
  key: 'enable-enterprise-tier',
  defaultValue: false,
  decide() {
    // return Math.random() > 0.5;
    return false;
  },
});

export const enableSbomDownload = flag({
  key: 'enable-sbom-download',
  // disabled until we have storage of discovered dependencies
  defaultValue: false,
  decide() {
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

export const enableDependabotConnectivityCheck = flag({
  key: 'enable-dependabot-connectivity-check',
  defaultValue: Boolean(process.env.DEPENDABOT_ENABLE_CONNECTIVITY_CHECK || '1'),
  decide() {
    return true;
  },
});

// Add more feature flags here as needed
