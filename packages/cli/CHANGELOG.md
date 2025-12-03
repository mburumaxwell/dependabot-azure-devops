# paklo

## 0.14.0

### Minor Changes

- f279661: Require schedule to be present in the updates configuration.
  Anyone using `.github/dependabot.{yaml,yml}` already has schema warnings in the IDE.
  This change is another step to bringing parity to the GitHub-hosted version and is necessary for our hosted version.

### Patch Changes

- Updated dependencies [985700f]
- Updated dependencies [f279661]
- Updated dependencies [34acb19]
- Updated dependencies [326ec5f]
  - @paklo/core@0.8.0
  - @paklo/runner@0.6.0

## 0.13.0

### Minor Changes

- 96d4898: Add verbosity option for dynamic logger level adjustment
- 7e4c4bd: Add cutoff option to cleanup command for customizable duration

### Patch Changes

- 45e8456: Refactor logger implementation to support customizable options and multiple output streams
- Updated dependencies [59c83f7]
- Updated dependencies [b6ca368]
- Updated dependencies [d315af2]
- Updated dependencies [45e8456]
- Updated dependencies [b201dae]
  - @paklo/runner@0.5.0
  - @paklo/core@0.7.3

## 0.12.2

### Patch Changes

- Updated dependencies [c5fb405]
- Updated dependencies [903ca2c]
  - @paklo/core@0.7.2
  - @paklo/runner@0.4.2

## 0.12.1

### Patch Changes

- Updated dependencies [5e16a01]
- Updated dependencies [f6e7cd9]
- Updated dependencies [434bc91]
- Updated dependencies [d79af62]
  - @paklo/runner@0.4.1
  - @paklo/core@0.7.1

## 0.12.0

### Minor Changes

- 3fcaa18: Add request inspection support for troubleshooting.
  - CLI `run` command can write raw Dependabot requests with `--inspect`, writing JSON snapshots under `./inspections`.
  - Core server accepts an optional inspect hook that records the raw request payload before processing.
- a03803e: Add `fetch-images` command

### Patch Changes

- Updated dependencies [ff9570c]
- Updated dependencies [5402afc]
- Updated dependencies [578e49b]
- Updated dependencies [b24a07a]
- Updated dependencies [3fcaa18]
- Updated dependencies [538ddb9]
- Updated dependencies [d999288]
- Updated dependencies [48615d6]
- Updated dependencies [80e7937]
  - @paklo/core@0.7.0
  - @paklo/runner@0.4.0

## 0.11.7

### Patch Changes

- 539f3f1: Rely on simpler config for provenance (NPM_CONFIG_PROVENANCE=true)
- 48edd06: Enable package provenance
- Updated dependencies [c327af1]
- Updated dependencies [539f3f1]
- Updated dependencies [48edd06]
  - @paklo/core@0.6.1
  - @paklo/runner@0.3.1

## 0.11.6

### Patch Changes

- 3dd9d68: Change job ID type from number to string.
  This is so as to support all possibilities (bigint/snowflake, ksuid, autoincrement, etc)
- b6d749c: Import from `zod` instead of `zod/v4`
- Updated dependencies [3dd9d68]
- Updated dependencies [b0a88f9]
- Updated dependencies [b6d749c]
- Updated dependencies [bb6d72b]
- Updated dependencies [4dcf614]
- Updated dependencies [a6af8fd]
  - @paklo/runner@0.3.0
  - @paklo/core@0.6.0

## 0.11.5

### Patch Changes

- Updated dependencies [f343e74]
- Updated dependencies [8c4f092]
- Updated dependencies [620e99e]
- Updated dependencies [e6f2019]
  - @paklo/runner@0.2.3
  - @paklo/core@0.5.0

## 0.11.4

### Patch Changes

- Updated dependencies [99d52cb]
  - @paklo/runner@0.2.2

## 0.11.3

### Patch Changes

- Updated dependencies [8041438]
- Updated dependencies [8041438]
- Updated dependencies [8c7637d]
- Updated dependencies [8041438]
  - @paklo/core@0.4.0
  - @paklo/runner@0.2.1

## 0.11.2

### Patch Changes

- 9042c4b: Add repository.directory to package.json for easier registry navigation
- fc95c84: Add `executableFiles` to cli package so that they get `chmod+x` automatically
- 86eadbf: No longer hoisting packages
- Updated dependencies [9042c4b]
- Updated dependencies [e843b12]
- Updated dependencies [3e9b4aa]
  - @paklo/runner@0.2.0
  - @paklo/core@0.3.0

## 0.11.1

### Patch Changes

- 034e685: More flexibility parsing azure devops URLs for org, project, or repo
- Updated dependencies [245b38c]
- Updated dependencies [beedd5a]
- Updated dependencies [89b166b]
- Updated dependencies [2781941]
- Updated dependencies [034e685]
- Updated dependencies [b1e02d5]
- Updated dependencies [1f89855]
- Updated dependencies [3d9f360]
- Updated dependencies [dd7764d]
- Updated dependencies [4c4e1a3]
- Updated dependencies [c35a334]
  - @paklo/runner@0.1.1
  - @paklo/core@0.2.0

## 0.11.0

### Minor Changes

- f8fc3fb: Split CLI package into focused modules

### Patch Changes

- 1118859: Include project in usage telemetry
- Updated dependencies [f8fc3fb]
- Updated dependencies [8798722]
  - @paklo/core@0.1.0
  - @paklo/runner@0.1.0

## 0.10.1

### Patch Changes

- 5523b63: Bump dependabot-action from c8de751 to 6ec8998.
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251014173146 to v2.0.20251015175503
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251010195543 to v2.0.20251014173146
  - allow tenant-id and client-id in api information
- 14374e1: Bump dependabot-action from ddc330d to c8de751
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20250826205840 to v2.0.20251003180402
  - Pass OIDC environment variables to proxy

## 0.10.0

### Minor Changes

- 4c7e4f7: Add tool usage tracking.
  The information collected is shown in the logs at the end of each job.

  This is to help me understand the usage of the tool/extension/cli through a couple of weeks. There is no other source of this information except for when reviews are left but no-one is bothered to leave those or to even want to give feedback via other channels.
  Do people still use this? Let's find out.

## 0.9.0

### Minor Changes

- 755c770: Migrate to CJS+ESM to ESM-only
- 414b12d: Update [dependabot-action](https://github.com/github/dependabot-action) from `6b07cf6` to `ddc330d` which updates container images version and adds support for invocation of specific commands (graph)
- 93e4044: Migrate from tsup to tsdown
- 1c9b484: Restore order of finding dependabot config to remote first

### Patch Changes

- f489125: Use dynamic port for API server to avoid conflicts on busy hosts
- 6367fe1: Update default experiments as of 24 September 2025

## 0.8.3

### Patch Changes

- fd123bc: Fix Docker host resolution for API URLs and add extra hosts for Linux compatibility
- 8162cb8: Remove `dependabotApiLocalUrl` instead manipulate `dependabotApiUrl`
- 776d6ef: Do not allow glob patterns in update.directory

## 0.8.2

### Patch Changes

- cb0dabc: Add support for macOS by disabling WriteXorExecute for .NET updates on Apple Silicon
- 4dda9b7: Add missing updaterImage to job execution calls
- 565a4b7: Make `rootDir` optional when calling `getDependabotConfig` but default to current process directory

## 0.8.1

### Patch Changes

- 6965069: Set security vulnerabilities also when not updating a specific PR
- fd21a8e: Make 'commit-message-options' required in DependabotJobConfigSchema and default to null members when mapping
- 14516ac: Make 'dependency-name' required in DependabotConditionSchema and default to wildcard when mapping

## 0.8.0

### Minor Changes

- df23ea4: Change repository argument into required option
- f8842b3: Change project argument into required option
- 477100c: Change organisation-url argument into required option

## 0.7.0

### Minor Changes

- 464b287: Add support for running with Docker directly instead of through dependabot-cli
- 6eedcd0: Add support for cleaning up old images, containers or networks
- 98b0674: Update job config schema to make certain fields required. The dependabot-cli used to fill this automatically but without it, we need to add them
- 47549f4: Add jobs runner that contains most logic from run command
- e552f59: Replace axios with inbuilt fetch
- b8c85fd: Allow selection of target update ids in the CLI
- 81eed7e: Replicate output processor functionality into a local server bridging Azure DevOps and dependabot
- 50ab5c7: Skip authentication of job token if the request is HTTP because the proxy will have omitted it
- 544fca1: Convert extension task to no longer use dependabot CLI
- 5fe3503: Support security only updates in CLI
- 16b1cb6: Added ApiClient which sits in between the runner and the API
  This gets the CLI and shared package at par with github/dependabot-action clearing the way for migrating the v2 task and for managed runs later.
- 058603b: Replace azure-devops-node-api with native fetch calls
- 99dd824: Change job id values to be numbers generated randomly by default
- c63f3ee: Refactor authentication to be job specific even though we use the same token for all jobs in the CLI

### Patch Changes

- 566068d: Give the server a second to startup
- 48ed65e: Remove logging using `azure-pipelines-task-lib` in shared package
- 2a09c52: Change job token generation to crypto random
- 076178d: Find values for replacing tokens from the environment variables too
- 3790eee: Add --job-token option for easier life during testing
- 9ef5de7: Server should listen to all interfaces for local/host server

## 0.6.0

### Minor Changes

- 93b046c: Merge generate CLI command into run with a new `-generate-only` option
- fe8db3f: Add hono server to handle requests from API
- f622323: Move azure devops client logic to shared package

### Patch Changes

- 020075a: Move fetching of dependabot config to shared package

## 0.5.0

### Minor Changes

- bda2624: Added basic run command to CLI

### Patch Changes

- e4ce93e: Generate job token and set in ENV for future use

## 0.4.1

### Patch Changes

- 0be3fba: Update default experiments as of 04 August 2025

## 0.4.0

### Minor Changes

- 131d0f1: Added command to CLI to generate dependabot job files

### Patch Changes

- 4f9929b: Update default experiments as of 16 June 2025
- a257919: Update default experiments as of 02 July 2025

## 0.3.0

### Minor Changes

- 5af507a: Added CLI with command to validate a dependabot configuration file

### Patch Changes

- 86822e2: Fix invalid yaml references

## 0.2.0

### Minor Changes

- aaf6698: Complete enforcing of strict typescript

## 0.1.3

### Patch Changes

- 765bd89: pr-title and comimt-message are often omitted in update_pull_request

## 0.1.2

### Patch Changes

- 47b79b3: Script typing improvements

## 0.1.1

### Patch Changes

- 981fb6a: Replace ||= with ??= to preserve falsy values in default assignment
- 57a09c2: Coerce parsing of updated-at in ignore-conditions

## 0.1.0

### Minor Changes

- e6c0ffa: Added a new core package which stores some logic to be shared by extensions, dashboard, and servers with validation of config via zod
- 8985a46: Add schemas for input and output hence validate scenarios

### Patch Changes

- 1036cdf: Update default experiments as of 09 June 2025
- eb5edee: Pass `enable-beta-ecosystems` to the job config
- 5301c73: Set `multi-ecosystem-update` in job config
