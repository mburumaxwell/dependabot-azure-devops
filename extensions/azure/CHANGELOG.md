# extension-azure-devops

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
