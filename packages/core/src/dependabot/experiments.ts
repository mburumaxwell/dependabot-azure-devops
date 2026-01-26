import type { DependabotExperiments } from './job';

// The default experiments known to be used by the GitHub Dependabot service.
// This changes often, update as needed by extracting them from a Dependabot GitHub Action run.
//  e.g. https://github.com/mburumaxwell/paklo/actions/workflows/dependabot/dependabot-updates
export const DEFAULT_EXPERIMENTS: DependabotExperiments = {
  'record-ecosystem-versions': true,
  'record-update-job-unknown-error': true,
  'proxy-cached': true,
  'enable-record-ecosystem-meta': true,
  'enable-corepack-for-npm-and-yarn': true,
  'enable-private-registry-for-corepack': true,
  'enable-shared-helpers-command-timeout': true,
  'enable-dependabot-setting-up-cronjob': true,
  'enable-engine-version-detection': true,
  'avoid-duplicate-updates-package-json': true,
  'allow-refresh-for-existing-pr-dependencies': true,
  'allow-refresh-group-with-all-dependencies': true,
  'enable-enhanced-error-details-for-updater': true,
  'gradle-lockfile-updater': true,
  'gradle-wrapper-updater': true,
  'enable-exclude-paths-subdirectory-manifest-files': true,
  'group-membership-enforcement': true,
  'deprecate-close-command': true,
  'deprecate-reopen-command': true,
  'deprecate-merge-command': true,
  'deprecate-cancel-merge-command': true,
  'deprecate-squash-merge-command': true,
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

/**
 * Set experiment in the given experiments map.
 * If the experiments map is undefined, a new map will be created.
 * @param experiments The experiments map to set the experiment in.
 * @param name The name of the experiment to set.
 * @param value The value of the experiment to set. Defaults to true.
 * @returns The updated experiments map.
 */
export function setExperiment(
  experiments: DependabotExperiments | undefined,
  name: string,
  value: boolean | string = true,
): DependabotExperiments {
  return {
    ...(experiments || {}),
    // always add the experiment, even if the value is false or an empty string
    // this allows explicit disabling of experiments
    [name]: value,
  };
}
