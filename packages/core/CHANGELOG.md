# @paklo/core

## 0.12.0

### Minor Changes

- [#2404](https://github.com/mburumaxwell/paklo/pull/2404) [`fb32322`](https://github.com/mburumaxwell/paklo/commit/fb32322f3f2fd61ccf5fee82323d497f28638b13) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Repository renamed to paklo

- [#2406](https://github.com/mburumaxwell/paklo/pull/2406) [`4b8ad36`](https://github.com/mburumaxwell/paklo/commit/4b8ad363bae686633a733eeb41b10ae1eb107e14) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Updated documentation to catch up with months of changes

- [`fd36772`](https://github.com/mburumaxwell/paklo/commit/fd36772d78b977403fef4ef983f22117ca9cd47c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Standard spelling for orgs (organization)
  Even though we should be using organisation, there are places we cannot change. Hence, we choose consistency.

### Patch Changes

- [#2405](https://github.com/mburumaxwell/paklo/pull/2405) [`79d860b`](https://github.com/mburumaxwell/paklo/commit/79d860bcc8a5d1cc3a8e4c0ffb9228be25986281) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Update default experiments as of 08 January 2026

## 0.11.1

### Patch Changes

- [#2365](https://github.com/mburumaxwell/paklo/pull/2365) [`f172ddf`](https://github.com/mburumaxwell/paklo/commit/f172ddffb28a8ebc4ad058f5bd411009eae3eb04) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - `conda` ecosystem graduated to stable
  Official changelog: https://github.blog/changelog/2025-12-16-conda-ecosystem-support-for-dependabot-now-generally-available/

- [#2368](https://github.com/mburumaxwell/paklo/pull/2368) [`32705f9`](https://github.com/mburumaxwell/paklo/commit/32705f958be5e00f08028977967645e0f9370572) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - `opentofu` ecosystem graduated to stable
  Official changelog: https://github.blog/changelog/2025-12-16-dependabot-version-updates-now-support-opentofu

- [#2366](https://github.com/mburumaxwell/paklo/pull/2366) [`26bcf23`](https://github.com/mburumaxwell/paklo/commit/26bcf23a6a7195c3ae9f5477222deb460a70091e) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - `bazel` ecosystem graduated to stable
  Official changelog: https://github.blog/changelog/2025-12-16-dependabot-version-updates-now-support-bazel

## 0.11.0

### Minor Changes

- dd14205: Only output logs from proxy if in debug mode. This is meant to reduce unnecessary logs output in Azure pipelines hence avoid low/no disk space errors.

### Patch Changes

- c55d8d1: Refactor URL handling in Azure DevOps client or prevent double encoding of project and repository names

## 0.10.0

### Minor Changes

- a28b3cf: Add method to get diff from commits
- 8d56957: Changes (renaming and moving things around) to support features in the hosted version

## 0.9.0

### Minor Changes

- e9b5d09: Extract and hence test functionality to get identity API url
- e9b5d09: Improve azure client request/response types with zod (schema validation in the future)
- e9b5d09: Make use of ky instead of direct fetch to improve retries and remove own HTTP client implementation

### Patch Changes

- 0fe301e: No longer expose random gen for job id, move it closer to where in use
- abf1f0e: Fix log level filtering with pino's multistream

## 0.8.0

### Minor Changes

- f279661: Require schedule to be present in the updates configuration.
  Anyone using `.github/dependabot.{yaml,yml}` already has schema warnings in the IDE.
  This change is another step to bringing parity to the GitHub-hosted version and is necessary for our hosted version.

### Patch Changes

- 985700f: Set `enable_beta_ecosystems` experiment if the `enable-beta-ecosystems` is set in the config

## 0.7.3

### Patch Changes

- 59c83f7: Add support for `record_cooldown_meta` endpoint though unused
- d315af2: Support for conda ecosystem/manager (in beta)
  Official changelog (unpublished): https://github.blog/changelog/2025-09-16-conda-ecosystem-support-for-dependabot-now-generally-available
- 45e8456: Refactor logger implementation to support customizable options and multiple output streams

## 0.7.2

### Patch Changes

- c5fb405: Restore empty string for 'content_encoding' hence fix gomod issue
- 903ca2c: Add Docker container detection and update telemetry schema

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
