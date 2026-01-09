# extension-azure-devops

## 2.64.0

### Minor Changes

- [#2404](https://github.com/mburumaxwell/paklo/pull/2404) [`fb32322`](https://github.com/mburumaxwell/paklo/commit/fb32322f3f2fd61ccf5fee82323d497f28638b13) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Repository renamed to paklo

- [#2406](https://github.com/mburumaxwell/paklo/pull/2406) [`4b8ad36`](https://github.com/mburumaxwell/paklo/commit/4b8ad363bae686633a733eeb41b10ae1eb107e14) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Updated documentation to catch up with months of changes

- [`fd36772`](https://github.com/mburumaxwell/paklo/commit/fd36772d78b977403fef4ef983f22117ca9cd47c) Thanks [@mburumaxwell](https://github.com/mburumaxwell)! - Standard spelling for orgs (organization)
  Even though we should be using organisation, there are places we cannot change. Hence, we choose consistency.

### Patch Changes

- Updated dependencies [[`7c5ee09`](https://github.com/mburumaxwell/paklo/commit/7c5ee0967dc6c2759d860e5091f67fe9e95d0e17), [`fb32322`](https://github.com/mburumaxwell/paklo/commit/fb32322f3f2fd61ccf5fee82323d497f28638b13), [`4b8ad36`](https://github.com/mburumaxwell/paklo/commit/4b8ad363bae686633a733eeb41b10ae1eb107e14), [`e1302ef`](https://github.com/mburumaxwell/paklo/commit/e1302efc21a07b11aad2d8111bde051f15f9d4a7), [`79d860b`](https://github.com/mburumaxwell/paklo/commit/79d860bcc8a5d1cc3a8e4c0ffb9228be25986281), [`fd36772`](https://github.com/mburumaxwell/paklo/commit/fd36772d78b977403fef4ef983f22117ca9cd47c), [`d96b059`](https://github.com/mburumaxwell/paklo/commit/d96b05982e5d1024d823cc21b12f3e0ce3ed4abf)]:
  - @paklo/runner@0.9.0
  - @paklo/core@0.12.0

## 2.63.3

### Patch Changes

- Updated dependencies [[`d2aa368`](https://github.com/mburumaxwell/paklo/commit/d2aa368588b40f7b774b7d3da9d054396455280b)]:
  - @paklo/runner@0.8.3

## 2.63.2

### Patch Changes

- Updated dependencies [[`f172ddf`](https://github.com/mburumaxwell/paklo/commit/f172ddffb28a8ebc4ad058f5bd411009eae3eb04), [`32705f9`](https://github.com/mburumaxwell/paklo/commit/32705f958be5e00f08028977967645e0f9370572), [`045c3fb`](https://github.com/mburumaxwell/paklo/commit/045c3fb1ece48904e4193b760ceb8e22a57609c7), [`26bcf23`](https://github.com/mburumaxwell/paklo/commit/26bcf23a6a7195c3ae9f5477222deb460a70091e), [`9ebdafd`](https://github.com/mburumaxwell/paklo/commit/9ebdafd43b5e87d04a06c4a16b6c4750455dace5)]:
  - @paklo/core@0.11.1
  - @paklo/runner@0.8.2

## 2.63.1

### Patch Changes

- c55d8d1: Refactor URL handling in Azure DevOps client or prevent double encoding of project and repository names
- Updated dependencies [dd14205]
- Updated dependencies [c55d8d1]
  - @paklo/core@0.11.0
  - @paklo/runner@0.8.1

## 2.63.0

### Minor Changes

- b846ab7: Remove unused `proxyCertPath` support, no request for functionality and there are other means

### Patch Changes

- Updated dependencies [a45dfdf]
- Updated dependencies [3eb60b8]
- Updated dependencies [a28b3cf]
- Updated dependencies [8d56957]
- Updated dependencies [d2fea4e]
- Updated dependencies [8679f32]
  - @paklo/runner@0.8.0
  - @paklo/core@0.10.0

## 2.62.0

### Minor Changes

- e9b5d09: Extract and hence test functionality to get identity API url

### Patch Changes

- Updated dependencies [e9b5d09]
- Updated dependencies [9a4f3ea]
- Updated dependencies [0fe301e]
- Updated dependencies [e9d5ad2]
- Updated dependencies [128bd4e]
- Updated dependencies [abf1f0e]
- Updated dependencies [e9b5d09]
- Updated dependencies [e9b5d09]
  - @paklo/core@0.9.0
  - @paklo/runner@0.7.0

## 2.61.0

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

## 2.60.0

### Minor Changes

- b6ca368: Fix outStream to write to stdout instead of stderr
- b201dae: No longer log the request body in local server as one can use inspect with CLI

### Patch Changes

- 827a434: Update logger level based on debug input (env:System.Debug)
- Updated dependencies [59c83f7]
- Updated dependencies [b6ca368]
- Updated dependencies [d315af2]
- Updated dependencies [45e8456]
- Updated dependencies [b201dae]
  - @paklo/runner@0.5.0
  - @paklo/core@0.7.3

## 2.59.13

### Patch Changes

- Updated dependencies [c5fb405]
- Updated dependencies [903ca2c]
  - @paklo/core@0.7.2
  - @paklo/runner@0.4.2

## 2.59.12

### Patch Changes

- Updated dependencies [5e16a01]
- Updated dependencies [f6e7cd9]
- Updated dependencies [434bc91]
- Updated dependencies [d79af62]
  - @paklo/runner@0.4.1
  - @paklo/core@0.7.1

## 2.59.11

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

## 2.59.10

### Patch Changes

- Updated dependencies [c327af1]
- Updated dependencies [539f3f1]
- Updated dependencies [48edd06]
  - @paklo/core@0.6.1
  - @paklo/runner@0.3.1

## 2.59.9

### Patch Changes

- 3dd9d68: Change job ID type from number to string.
  This is so as to support all possibilities (bigint/snowflake, ksuid, autoincrement, etc)
- Updated dependencies [3dd9d68]
- Updated dependencies [b0a88f9]
- Updated dependencies [b6d749c]
- Updated dependencies [bb6d72b]
- Updated dependencies [4dcf614]
- Updated dependencies [a6af8fd]
  - @paklo/runner@0.3.0
  - @paklo/core@0.6.0

## 2.59.8

### Patch Changes

- Updated dependencies [f343e74]
- Updated dependencies [8c4f092]
- Updated dependencies [620e99e]
- Updated dependencies [e6f2019]
  - @paklo/runner@0.2.3
  - @paklo/core@0.5.0

## 2.59.7

### Patch Changes

- Updated dependencies [99d52cb]
  - @paklo/runner@0.2.2

## 2.59.6

### Patch Changes

- Updated dependencies [8041438]
- Updated dependencies [8041438]
- Updated dependencies [8c7637d]
- Updated dependencies [8041438]
  - @paklo/core@0.4.0
  - @paklo/runner@0.2.1

## 2.59.5

### Patch Changes

- 9042c4b: Add repository.directory to package.json for easier registry navigation
- 86eadbf: No longer hoisting packages
- Updated dependencies [9042c4b]
- Updated dependencies [e843b12]
- Updated dependencies [3e9b4aa]
  - @paklo/runner@0.2.0
  - @paklo/core@0.3.0

## 2.59.4

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

## 2.59.3

### Patch Changes

- f8fc3fb: Split CLI package into focused modules
- Updated dependencies [f8fc3fb]
- Updated dependencies [8798722]
  - @paklo/core@0.1.0
  - @paklo/runner@0.1.0

## 2.59.2

### Patch Changes

- Updated dependencies [5523b63]
- Updated dependencies [14374e1]
  - @paklo/cli@0.10.1

## 2.59.1

### Patch Changes

- Updated dependencies [4c7e4f7]
  - @paklo/cli@0.10.0

## 2.59.0

### Minor Changes

- 414b12d: Update [dependabot-action](https://github.com/github/dependabot-action) from `6b07cf6` to `ddc330d` which updates container images version and adds support for invocation of specific commands (graph)
- 1c9b484: Restore order of finding dependabot config to remote first

### Patch Changes

- f489125: Use dynamic port for API server to avoid conflicts on busy hosts
- 48f5703: Restructure files into folders by version to allow for other versions smoothly
- 095be37: Warn the use of proxy cert not migrated
- Updated dependencies [f489125]
- Updated dependencies [6367fe1]
- Updated dependencies [755c770]
- Updated dependencies [414b12d]
- Updated dependencies [93e4044]
- Updated dependencies [1c9b484]
  - @paklo/cli@0.9.0

## 2.58.4

### Patch Changes

- Updated dependencies [fd123bc]
- Updated dependencies [8162cb8]
- Updated dependencies [776d6ef]
  - @paklo/cli@0.8.3

## 2.58.3

### Patch Changes

- Updated dependencies [cb0dabc]
- Updated dependencies [4dda9b7]
- Updated dependencies [565a4b7]
  - @paklo/cli@0.8.2

## 2.58.2

### Patch Changes

- Updated dependencies [6965069]
- Updated dependencies [fd21a8e]
- Updated dependencies [14516ac]
  - @paklo/cli@0.8.1

## 2.58.1

### Patch Changes

- Updated dependencies [df23ea4]
- Updated dependencies [f8842b3]
- Updated dependencies [477100c]
  - @paklo/cli@0.8.0

## 2.58.0

### Minor Changes

- 6eedcd0: Add support for cleaning up old images, containers or networks
- 81eed7e: Replicate output processor functionality into a local server bridging Azure DevOps and dependabot
- 544fca1: Convert extension task to no longer use dependabot CLI
- 058603b: Replace azure-devops-node-api with native fetch calls
- 99dd824: Change job id values to be numbers generated randomly by default

### Patch Changes

- 5fe3503: Support security only updates in CLI
- 44bd9a9: Flat file layout in the extension for easier migration to shared tools
- Updated dependencies [464b287]
- Updated dependencies [566068d]
- Updated dependencies [6eedcd0]
- Updated dependencies [98b0674]
- Updated dependencies [47549f4]
- Updated dependencies [48ed65e]
- Updated dependencies [e552f59]
- Updated dependencies [2a09c52]
- Updated dependencies [b8c85fd]
- Updated dependencies [076178d]
- Updated dependencies [3790eee]
- Updated dependencies [81eed7e]
- Updated dependencies [50ab5c7]
- Updated dependencies [544fca1]
- Updated dependencies [5fe3503]
- Updated dependencies [16b1cb6]
- Updated dependencies [058603b]
- Updated dependencies [99dd824]
- Updated dependencies [9ef5de7]
- Updated dependencies [c63f3ee]
  - paklo@0.7.0

## 2.57.0

### Minor Changes

- f622323: Move azure devops client logic to shared package

### Patch Changes

- 020075a: Move fetching of dependabot config to shared package
- Updated dependencies [93b046c]
- Updated dependencies [fe8db3f]
- Updated dependencies [020075a]
- Updated dependencies [f622323]
  - paklo@0.6.0

## 2.56.0

### Minor Changes

- e4ce93e: Generate job token and set in ENV for future use
- 45eb3e3: `dependabotCliApiListeningPort` should be treated as an integer/number

### Patch Changes

- Updated dependencies [bda2624]
- Updated dependencies [e4ce93e]
  - paklo@0.5.0

## 2.55.1

### Patch Changes

- Updated dependencies [0be3fba]
  - paklo@0.4.1

## 2.55.0

### Minor Changes

- 2814fd6: Fix open PR limit per package-ecosystem.

### Patch Changes

- 9aba8a9: Remove the `skipPullRequests` input

## 2.54.0

### Minor Changes

- 131d0f1: Added command to CLI to generate dependabot job files

### Patch Changes

- Updated dependencies [4f9929b]
- Updated dependencies [131d0f1]
- Updated dependencies [a257919]
  - paklo@0.4.0

## 2.53.2

### Patch Changes

- e1dc185: Fix filtering logic for existing pull requests between grouped and normal
- d010d50: Do not write YAML files with refs

## 2.53.1

### Patch Changes

- 5af507a: Added CLI with command to validate a dependabot configuration file
- Updated dependencies [5af507a]
- Updated dependencies [86822e2]
  - paklo@0.3.0

## 2.53.0

### Minor Changes

- 4e34a26: Fix dependabot cli execution environment variables
- aaf6698: Complete enforcing of strict typescript

### Patch Changes

- 761fb3e: Non-zero result from dependabot-cli should result in a failed result
- Updated dependencies [aaf6698]
  - paklo@0.2.0

## 2.52.1

### Patch Changes

- Updated dependencies [765bd89]
  - paklo@0.1.3

## 2.52.0

### Minor Changes

- dbe39d1: Collect affected PRs for a given run and set output variable

### Patch Changes

- 47b79b3: Script typing improvements
- 22ee21d: Use ||= instead of ??= when finding go/dependabot tool
- Updated dependencies [47b79b3]
  - paklo@0.1.2

## 2.51.1

### Patch Changes

- 981fb6a: Replace ||= with ??= to preserve falsy values in default assignment
- Updated dependencies [981fb6a]
- Updated dependencies [57a09c2]
  - paklo@0.1.1

## 2.51.0

### Minor Changes

- d3ba65b: Treat assignees as optional reviewers
- e6c0ffa: Added a new core package which stores some logic to be shared by extensions, dashboard, and servers with validation of config via zod
- 8985a46: Add schemas for input and output hence validate scenarios

### Patch Changes

- cc3fb4c: Allow versioning of private packages without publishing
- eb5edee: Pass `enable-beta-ecosystems` to the job config
- 5301c73: Set `multi-ecosystem-update` in job config
- 0943939: Filter out empty entries from experiments input when parsing
- 335e4fe: Add changeset for easier change tracking and releasing
- Updated dependencies [1036cdf]
- Updated dependencies [eb5edee]
- Updated dependencies [5301c73]
- Updated dependencies [e6c0ffa]
- Updated dependencies [8985a46]
  - paklo@0.1.0
