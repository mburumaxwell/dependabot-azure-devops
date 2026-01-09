# @paklo/runner

## 0.9.0

### Minor Changes

- [#2404](https://github.com/mburumaxwell/paklo/pull/2404) [`fb32322`](https://github.com/mburumaxwell/paklo/commit/fb32322f3f2fd61ccf5fee82323d497f28638b13) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Repository renamed to paklo

- [#2406](https://github.com/mburumaxwell/paklo/pull/2406) [`4b8ad36`](https://github.com/mburumaxwell/paklo/commit/4b8ad363bae686633a733eeb41b10ae1eb107e14) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Updated documentation to catch up with months of changes

- [#2401](https://github.com/mburumaxwell/paklo/pull/2401) [`e1302ef`](https://github.com/mburumaxwell/paklo/commit/e1302efc21a07b11aad2d8111bde051f15f9d4a7) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Remove `fetch_files` command.
  In <https://github.com/dependabot/dependabot-core/pull/13275> the `fetch_files` command was made a no-op, and it does not need to be called.
  Also cleaned up environment variables that are not used as a result.
  Copied from: <https://github.com/github/dependabot-action/pull/1550>

- [`fd36772`](https://github.com/mburumaxwell/paklo/commit/fd36772d78b977403fef4ef983f22117ca9cd47c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Standard spelling for orgs (organization)
  Even though we should be using organisation, there are places we cannot change. Hence, we choose consistency.

### Patch Changes

- [#2397](https://github.com/mburumaxwell/paklo/pull/2397) [`7c5ee09`](https://github.com/mburumaxwell/paklo/commit/7c5ee0967dc6c2759d860e5091f67fe9e95d0e17) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump the dependabot-core-images (29 updates) to from various versions to `v2.0.20260108161155`.

- [#2398](https://github.com/mburumaxwell/paklo/pull/2398) [`d96b059`](https://github.com/mburumaxwell/paklo/commit/d96b05982e5d1024d823cc21b12f3e0ce3ed4abf) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bumps github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251219172147 to v2.0.20260106190418.

- Updated dependencies [[`fb32322`](https://github.com/mburumaxwell/paklo/commit/fb32322f3f2fd61ccf5fee82323d497f28638b13), [`4b8ad36`](https://github.com/mburumaxwell/paklo/commit/4b8ad363bae686633a733eeb41b10ae1eb107e14), [`79d860b`](https://github.com/mburumaxwell/paklo/commit/79d860bcc8a5d1cc3a8e4c0ffb9228be25986281), [`fd36772`](https://github.com/mburumaxwell/paklo/commit/fd36772d78b977403fef4ef983f22117ca9cd47c)]:
  - @paklo/core@0.12.0

## 0.8.3

### Patch Changes

- [#2380](https://github.com/mburumaxwell/paklo/pull/2380) [`d2aa368`](https://github.com/mburumaxwell/paklo/commit/d2aa368588b40f7b774b7d3da9d054396455280b) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump the dependabot-core-images (29 updates) to from various versions to `v2.0.20260101165450`

## 0.8.2

### Patch Changes

- [#2357](https://github.com/mburumaxwell/paklo/pull/2357) [`045c3fb`](https://github.com/mburumaxwell/paklo/commit/045c3fb1ece48904e4193b760ceb8e22a57609c7) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump the dependabot-core-images (29 updates) to from various versions to `v2.0.20251219223432`

- [#2358](https://github.com/mburumaxwell/paklo/pull/2358) [`9ebdafd`](https://github.com/mburumaxwell/paklo/commit/9ebdafd43b5e87d04a06c4a16b6c4750455dace5) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bumps github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251212184225 to v2.0.20251219172147.

- Updated dependencies [[`f172ddf`](https://github.com/mburumaxwell/paklo/commit/f172ddffb28a8ebc4ad058f5bd411009eae3eb04), [`32705f9`](https://github.com/mburumaxwell/paklo/commit/32705f958be5e00f08028977967645e0f9370572), [`26bcf23`](https://github.com/mburumaxwell/paklo/commit/26bcf23a6a7195c3ae9f5477222deb460a70091e)]:
  - @paklo/core@0.11.1

## 0.8.1

### Patch Changes

- Updated dependencies [dd14205]
- Updated dependencies [c55d8d1]
  - @paklo/core@0.11.0

## 0.8.0

### Minor Changes

- 8d56957: Changes (renaming and moving things around) to support features in the hosted version
- 8679f32: Do not log proxy output unless debug is enabled.
  This should reduce the number of logs and avoid hitting the pipelines log file limit.

### Patch Changes

- a45dfdf: Bump dependabot-action from `e2b700a` to `fd57fff`
  - Update image pull backoff params
- 3eb60b8: Bumps github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251202213123 to v2.0.20251212184225.
- d2fea4e: Bump the dependabot-core-images (29 updates) to from various versions to `v2.0.20251212192154`
- Updated dependencies [a28b3cf]
- Updated dependencies [8d56957]
  - @paklo/core@0.10.0

## 0.7.0

### Minor Changes

- e9b5d09: Make use of ky instead of direct fetch to improve retries and remove own HTTP client implementation

### Patch Changes

- 9a4f3ea: Expose constants and helper functions from runner that are needed by web
- 0fe301e: No longer expose random gen for job id, move it closer to where in use
- e9d5ad2: Bump the dependabot-core-images (29 updates) to from various versions to `v2.0.20251207232046`
- 128bd4e: Bump github/dependabot-update-job-proxy/dependabot-update-job-proxy from v2.0.20251124194534 to v2.0.20251202213123
- Updated dependencies [e9b5d09]
- Updated dependencies [0fe301e]
- Updated dependencies [abf1f0e]
- Updated dependencies [e9b5d09]
- Updated dependencies [e9b5d09]
  - @paklo/core@0.9.0

## 0.6.0

### Minor Changes

- f279661: Require schedule to be present in the updates configuration.
  Anyone using `.github/dependabot.{yaml,yml}` already has schema warnings in the IDE.
  This change is another step to bringing parity to the GitHub-hosted version and is necessary for our hosted version.

### Patch Changes

- 34acb19: Bump the dependabot-core-images (29 updates) to from various versions to `v2.0.20251201212603`
- 326ec5f: Bumps [github/dependabot-update-job-proxy/dependabot-update-job-proxy](https://github.com/github/dependabot-update-job-proxy) from v2.0.20251114180523 to v2.0.20251124194534
- Updated dependencies [985700f]
- Updated dependencies [f279661]
  - @paklo/core@0.8.0

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
