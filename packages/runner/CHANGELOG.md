# @paklo/runner

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
