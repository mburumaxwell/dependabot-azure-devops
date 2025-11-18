# @paklo/core

## 0.6.1

### Patch Changes

- c327af1: Fix content handling in pull request file changes and update schema to allow nullish content
- 539f3f1: Rely on simpler config for provenance (NPM_CONFIG_PROVENANCE=true)
- 48edd06: Enable package provenance

## 0.6.0

### Minor Changes

- 3dd9d68: Change job ID type from number to string.
  This is so as to support all possibilities (bigint/snowflake, ksuid, autoincrement, etc)
- b0a88f9: Bump dependabot-action from `3ae7b48` to `7f78151`.
  - Add support for `opentofu`
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251023141128 to v2.0.20251113195050
- bb6d72b: Make `DependabotJobConfig.id` required hence remove `jobId` from `DependabotJobBuilderOutput` and related references
- a6af8fd: Replace `generateKey(...)` with `Keygen` class to avoid conflicts with crypto method

### Patch Changes

- b6d749c: Import from `zod` instead of `zod/v4`
- 4dcf614: Add `bazel` to package ecosystems/managers, only allowed when `enable-beta-ecosystems` is set to `true`.

## 0.5.0

### Minor Changes

- 620e99e: Added detection of duplicate updates by ecosystem and directory/directories

### Patch Changes

- f343e74: Share utility for key generation
- 8c4f092: Handle organization URLs without trailing slashes.
  For example `https://dev.azure.com/contoso/` and `https://dev.azure.com/contoso` now result in the same organization.
- e6f2019: Require `cronjob` to be set when `interval` is set to `cron`

## 0.4.0

### Minor Changes

- 8041438: Migrate from deprecated GitHub `cvss` field to `cvssSeverities` with v4.0 support

  Updated GitHub Security Advisory client to use the new `cvssSeverities` API that provides both CVSS v3.1 and v4.0 scores, replacing the deprecated cvss field. The implementation prioritizes CVSS v4.0 when available for enhanced vulnerability scoring accuracy and future compatibility.

- 8041438: Use schema to validate response from GHSA hence update it to correct version
- 8c7637d: Make use of [`octokit-js`](https://github.com/octokit/octokit.js) instead of rolling own

### Patch Changes

- 8041438: Move to next package after logging vulnerabilities fetch failure

## 0.3.0

### Minor Changes

- e843b12: Rename url.url to url.value
- 3e9b4aa: No longer need browser exports

### Patch Changes

- 9042c4b: Add repository.directory to package.json for easier registry navigation

## 0.2.0

### Minor Changes

- 89b166b: Support for pub-repository
  Docs: https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#pub-repository
- 2781941: Parsing and validation for multi-ecosystem updates
- 1f89855: Support for helm-registry
  Docs: https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#helm-registry
- 3d9f360: Support for cargo-registry
  Docs: https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#cargo-registry
- dd7764d: Support for goproxy-server
  Docs: https://docs.github.com/en/enterprise-cloud@latest/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot#goproxy-server

### Patch Changes

- 245b38c: Warn missing schedules in updates; enforce requirement after 2025-Nov-30.
  This is to be closer to the official dependabot configuration options. The extensions and CLI do not use this but it may be used on the server based options.
- beedd5a: Update default experiments as of 23 October 2025
- 034e685: More flexibility parsing azure devops URLs for org, project, or repo
- b1e02d5: Bump dependabot-action from 6ec8998 to 497bdeb.
  - Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251015175503 to v2.0.20251023141128.
  - Added julia
- 4c4e1a3: Support for rust-toolchain ecosystem/manager
  Official changelog: https://github.blog/changelog/2025-08-19-dependabot-now-supports-rust-toolchain-updates/
- c35a334: Support for vcpkg ecosystem/manager
  Official changelog: https://github.blog/changelog/2025-08-12-dependabot-version-updates-now-support-vcpkg/

## 0.1.0

### Minor Changes

- f8fc3fb: Split CLI package into focused modules

### Patch Changes

- 8798722: Generate browser target for core package where possible
