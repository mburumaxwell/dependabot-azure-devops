import type { DependabotExperiments } from './job';

// The default experiments known to be used by the GitHub Dependabot service.
// This changes often, update as needed by extracting them from a Dependabot GitHub Action run.
//  e.g. https://github.com/mburumaxwell/dependabot-azure-devops/actions/workflows/dependabot/dependabot-updates
export const DEFAULT_EXPERIMENTS: DependabotExperiments = {
  'record-ecosystem-versions': true,
  'record-update-job-unknown-error': true,
  'proxy-cached': true,
  'move-job-token': true,
  'dependency-change-validation': true,
  'enable-file-parser-python-local': true,
  'npm-fallback-version-above-v6': true,
  'lead-security-dependency': true,
  'enable-record-ecosystem-meta': true,
  'enable-corepack-for-npm-and-yarn': true,
  'enable-shared-helpers-command-timeout': true,
  'enable-dependabot-setting-up-cronjob': true,
  'enable-engine-version-detection': true,
  'avoid-duplicate-updates-package-json': true,
  'allow-refresh-for-existing-pr-dependencies': true,
  'allow-refresh-group-with-all-dependencies': true,
  'exclude-local-composer-packages': true,
  'enable-enhanced-error-details-for-updater': true,
  'enable-cooldown-for-python': true,
  'enable-cooldown-for-uv': true,
  'enable-cooldown-for-npm-and-yarn': true,
  'enable-cooldown-for-nuget': true,
  'enable-cooldown-for-bun': true,
  'enable-cooldown-for-bundler': true,
  'enable-cooldown-for-cargo': true,
  'enable-cooldown-for-maven': true,
  'enable-cooldown-for-gomodules': true,
  'enable-cooldown-metrics-collection': true,
  'enable-cooldown-for-composer': true,
  'enable-cooldown-for-gradle': true,
  'enable-cooldown-for-pub': true,
  'enable-cooldown-for-gitsubmodules': true,
  'enable-cooldown-for-elm': true,
  'gradle-lockfile-updater': true,
  'enable-cooldown-for-github-actions': true,
  'enable-cooldown-for-dev-containers': true,
  'enable-cooldown-for-hex': true,
  'enable-cooldown-for-dotnet-sdk': true,
};

/**
 * Parses a comma-separated list of key=value pairs representing experiments.
 * @param raw A comma-separated list of key=value pairs representing experiments.
 * @returns A map of experiment names to their values.
 */
export function parseExperiments(raw?: string): DependabotExperiments | undefined {
  return raw
    ?.split(',')
    .filter((entry) => entry.trim() !== '') // <-- filter out empty entries
    .reduce((acc, cur) => {
      const [key, value] = cur.split('=', 2);
      acc[key!] = value || true;
      return acc;
    }, {} as DependabotExperiments);
}
