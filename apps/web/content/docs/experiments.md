---
title: Experiments
description: Enable and configure Dependabot experiments to access preview features and customize update behavior.
---

Dependabot uses an internal feature flag system called "experiments" to control new features and behavioral changes that are still being tested before becoming generally available (GA). Experiments allow you to opt-in to preview features, work around known issues, or customize update behavior for specific package ecosystems.

:::warning
Experiment names and behavior are not officially documented by Dependabot and may change without notice. They are internal implementation details that become public when users need workarounds or early access to features.
:::

## Default Experiments

By default, Paklo mirrors the experiments enabled in GitHub's hosted Dependabot service. These defaults are maintained in the codebase as a best-effort in parity with GitHub's behavior.

You can view the current default experiments here: [packages/core/src/dependabot/experiments.ts](https://github.com/mburumaxwell/paklo/blob/main/packages/core/src/dependabot/experiments.ts)

## Enabling Experiments

### With Azure DevOps Extension

Use the `experiments` task input with a comma-separated list of key/value pairs:

```yaml
- task: dependabot@2
  inputs:
    experiments: 'tidy=true,vendor=true,goprivate=*'
```

### With CLI

Use the `--experiments` option:

```bash
paklo run \
  --provider azure
  --repository-url https://dev.azure.com/my-org/my-project/_git/my-repo \
  --git-token $GIT_ACCESS_TOKEN \
  --experiments "tidy=true,vendor=true,goprivate=*"
```

### Hosted Service

Changing experiment is currently not supported in the hosted service.

### Format

Experiments follow the format: `key=value` or just `key` (for boolean flags). Multiple experiments are comma-separated:

```txt
experiment1=value1,experiment2=value2,booleanExperiment
```

## Finding Available Experiments

Since experiments aren't officially documented, you need to search the `dependabot-core` source code:

### Search Patterns

Use these GitHub code search queries to find experiments:

1. **Enable checks**: [`enabled?(x)`](https://github.com/search?q=repo%3Adependabot%2Fdependabot-core+%2Fenabled%5CW%5C%28.*%5C%29%2F&type=code)

   ```ruby
   # Example in Ruby code:
   if Dependabot::Experiments.enabled?(:my_experiment)
   ```

2. **Options fetch**: [`options.fetch(x)`](https://github.com/search?q=repo%3Adependabot%2Fdependabot-core+%2Foptions%5C.fetch%5C%28.*%2C%2F&type=code)

   ```ruby
   # Example in Ruby code:
   value = options.fetch(:my_option, default_value)
   ```

3. **Search by ecosystem**: Add the package ecosystem name to your search:

   ```txt
   repo:dependabot/dependabot-core "go_modules" "enabled?"
   repo:dependabot/dependabot-core "npm" "options.fetch"
   ```

### Recent Experiments

Check recent [commits](https://github.com/dependabot/dependabot-core/commits/main) and [pull requests](https://github.com/dependabot/dependabot-core/pulls) in `dependabot-core` for new experiments. Look for commits mentioning "experiment", "feature flag", or "opt-in".

## Overriding Default Experiments

When you specify experiments in the task input or CLI option, you **override all defaults**. If you want to keep the defaults and add additional experiments, you must explicitly list them all.

### Example: Adding to Defaults

If the default experiments are:

```txt
record_ecosystem_versions
```

And you want to add `separate_major_minor_updates`, specify both:

```yaml
experiments: 'record_ecosystem_versions,separate_major_minor_updates'
```
