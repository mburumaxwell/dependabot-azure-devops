// The default experiments known to be used by the GitHub Dependabot service.
// This changes often, update as needed by extracting them from a Dependabot GitHub Action run.
//  e.g. https://github.com/tinglesoftware/dependabot-azure-devops/actions/workflows/dependabot/dependabot-updates
export const DEFAULT_EXPERIMENTS: Record<string, string | boolean> = {
  'record-ecosystem-versions': true,
  'record-update-job-unknown-error': true,
  'proxy-cached': true,
  'move-job-token': true,
  'dependency-change-validation': true,
  'nuget-install-dotnet-sdks': true,
  'nuget-native-analysis': true,
  'nuget-use-direct-discovery': true,
  'enable-file-parser-python-local': true,
  'npm-fallback-version-above-v6': true,
  'npm-v6-deprecation-warning': true,
  'npm-v6-unsupported-error': true,
  'python-3-8-deprecation-warning': true,
  'python-3-8-unsupported-error': true,
  'lead-security-dependency': true,
  // NOTE: 'enable-record-ecosystem-meta' is not currently implemented in Dependabot-CLI.
  //       This experiment is primarily for GitHub analytics and doesn't add much value in the DevOps implementation.
  //       See: https://github.com/dependabot/dependabot-core/pull/10905
  // TODO: Revsit this if/when Dependabot-CLI supports it.
  //'enable-record-ecosystem-meta': true,
  'enable-shared-helpers-command-timeout': true,
  'enable-fix-for-pnpm-no-change-error': true,
  'enable-engine-version-detection': true,
  'avoid-duplicate-updates-package-json': true,
  'allow-refresh-for-existing-pr-dependencies': true,
};
