# @paklo/runner

## 0.5.0

### Minor Changes

- b6ca368: Fix outStream to write to stdout instead of stderr
- b201dae: No longer log the request body in local server as one can use inspect with CLI

### Patch Changes

- 59c83f7: Add support for `record_cooldown_meta` endpoint though unused
- d315af2: Support for conda ecosystem/manager (in beta)
  Official changelog (unpublished): https://github.blog/changelog/2025-09-16-conda-ecosystem-support-for-dependabot-now-generally-available
- Updated dependencies [59c83f7]
- Updated dependencies [d315af2]
- Updated dependencies [45e8456]
  - @paklo/core@0.7.3

## 0.4.2

### Patch Changes

- 903ca2c: Add Docker container detection and update telemetry schema
- Updated dependencies [c5fb405]
- Updated dependencies [903ca2c]
  - @paklo/core@0.7.2

## 0.4.1

### Patch Changes

- 5e16a01: Allow disabling usage telemetry by setting `PAKLO_TELEMETRY_DISABLED` env
  It can be set to any truthy value like 1, true, yes, etc to set it
- d79af62: Collect error messages for tracking where issues are coming from
- Updated dependencies [f6e7cd9]
- Updated dependencies [434bc91]
- Updated dependencies [d79af62]
  - @paklo/core@0.7.1

## 0.4.0

### Minor Changes

- 5402afc: Support for `create_dependency_submission` requests.
  While these requests are doing nothing at this time, it helps keep similar request possibilities to avoid jobs failing because of 404 responses.
  This could also be used in the managed version to support SBOM or checking vulnerabilities.
- 578e49b: Track docker images locally since `dependabot-action` is slow.
  This way newer docker images make it here a little faster.
- d999288: Bump the dependabot-core-images (28 updates) to from various versions to `v2.0.20251120202309`
- 80e7937: Support for `record_update_job_warning` by creating comments on modified pull requests.
  The `record_update_job_warning` is based on dependabot notices and is for scenarios such as when the package manager is outdated and Dependabot would stop supporting it.
  There are other scenarios when notices are generated.

### Patch Changes

- 48615d6: Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251113195050 to v2.0.20251114180523
- Updated dependencies [ff9570c]
- Updated dependencies [5402afc]
- Updated dependencies [b24a07a]
- Updated dependencies [3fcaa18]
- Updated dependencies [538ddb9]
- Updated dependencies [80e7937]
  - @paklo/core@0.7.0

## 0.3.1

### Patch Changes

- 539f3f1: Rely on simpler config for provenance (NPM_CONFIG_PROVENANCE=true)
- 48edd06: Enable package provenance
- Updated dependencies [c327af1]
- Updated dependencies [539f3f1]
- Updated dependencies [48edd06]
  - @paklo/core@0.6.1

## 0.3.0

### Minor Changes

- 3dd9d68: Change job ID type from number to string.
  This is so as to support all possibilities (bigint/snowflake, ksuid, autoincrement, etc)
- bb6d72b: Make `DependabotJobConfig.id` required hence remove `jobId` from `DependabotJobBuilderOutput` and related references

### Patch Changes

- a6af8fd: Replace `generateKey(...)` with `Keygen` class to avoid conflicts with crypto method
- Updated dependencies [3dd9d68]
- Updated dependencies [b0a88f9]
- Updated dependencies [b6d749c]
- Updated dependencies [bb6d72b]
- Updated dependencies [4dcf614]
- Updated dependencies [a6af8fd]
  - @paklo/core@0.6.0

## 0.2.3

### Patch Changes

- f343e74: Share utility for key generation
- Updated dependencies [f343e74]
- Updated dependencies [8c4f092]
- Updated dependencies [620e99e]
- Updated dependencies [e6f2019]
  - @paklo/core@0.5.0

## 0.2.2

### Patch Changes

- 99d52cb: Bumps dependabot-action from 39309f7 to 3ae7b48.
  - Extract the updater image's SHA from the input parameters and pass it as an envvar

## 0.2.1

### Patch Changes

- 8c7637d: Make use of [`octokit-js`](https://github.com/octokit/octokit.js) instead of rolling own
- Updated dependencies [8041438]
- Updated dependencies [8041438]
- Updated dependencies [8c7637d]
- Updated dependencies [8041438]
  - @paklo/core@0.4.0

## 0.2.0

### Minor Changes

- e843b12: Rename url.url to url.value

### Patch Changes

- 9042c4b: Add repository.directory to package.json for easier registry navigation
- Updated dependencies [9042c4b]
- Updated dependencies [e843b12]
- Updated dependencies [3e9b4aa]
  - @paklo/core@0.3.0

## 0.1.1

### Patch Changes

- 245b38c: Warn missing schedules in updates; enforce requirement after 2025-Nov-30.
  This is to be closer to the official dependabot configuration options. The extensions and CLI do not use this but it may be used on the server based options.
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
  - @paklo/core@0.2.0

## 0.1.0

### Minor Changes

- f8fc3fb: Split CLI package into focused modules

### Patch Changes

- Updated dependencies [f8fc3fb]
- Updated dependencies [8798722]
  - @paklo/core@0.1.0
