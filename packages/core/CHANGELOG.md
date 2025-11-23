# @paklo/core

## 0.7.1

### Patch Changes

- f6e7cd9: Update default experiments as of 23 November 2025
- 434bc91: Move environment and shared-date out of core for ease
- d79af62: Collect error messages for tracking where issues are coming from

## 0.7.0

### Minor Changes

- 5402afc: Support for `create_dependency_submission` requests.
  While these requests are doing nothing at this time, it helps keep similar request possibilities to avoid jobs failing because of 404 responses.
  This could also be used in the managed version to support SBOM or checking vulnerabilities.
- b24a07a: Use enum for dependabot close PR reason
- 3fcaa18: Add request inspection support for troubleshooting.
  - CLI `run` command can write raw Dependabot requests with `--inspect`, writing JSON snapshots under `./inspections`.
  - Core server accepts an optional inspect hook that records the raw request payload before processing.
- 80e7937: Support for `record_update_job_warning` by creating comments on modified pull requests.
  The `record_update_job_warning` is based on dependabot notices and is for scenarios such as when the package manager is outdated and Dependabot would stop supporting it.
  There are other scenarios when notices are generated.

### Patch Changes

- ff9570c: Prevent ReDoS vulnerabilities in regex patterns
  - Replace unsafe regex quantifiers in branch name normalization with safe string operations using split/filter/join
  - Replace regex-based placeholder extraction with bounded quantifiers and non-global matching to prevent exponential backtracking
  - Eliminates potential denial of service attacks from maliciously crafted input strings with consecutive special characters

- 538ddb9: Improve Azure DevOps file change handling for Dependabot updates
  - Skip no-op changes and avoid sending bodies for delete operations when pushing PR commits
  - Treat missing content and encoding as optional through the request models and builders
  - Tighten Dependabot dependency file schema with explicit operation and encoding enums

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
