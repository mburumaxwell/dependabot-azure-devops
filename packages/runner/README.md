## Paklo Runner

`@paklo/runner` mirrors the official `dependabot-action` runtime while adding the hooks we need to execute Dependabot jobs locally (via the CLI, Azure DevOps extension, or hosted service). It wires `@paklo/core` primitives into Docker orchestration, updater lifecycle management, and the lightweight local Azure runner/server.

### Usage Expectations

- Treated as an internal package; the public consumption surface is the CLI. Breaking changes can land without notice.
- For behavior details, refer to the `dependabot-action` documentation—the runner intentionally stays aligned with it. This README only highlights the local execution differences.
- Requires Node.js 22+ and access to a Docker daemon when running the full workflow.

### Development

- `pnpm dev` — watch mode for rapid iteration
- `pnpm test` — run Vitest (includes local runner/server tests)
- `pnpm lint` — Biome checks
- `pnpm build` — produce compiled artifacts

Troubleshooting tips, release process, and support contacts are the same as the main repository. File issues or questions at https://github.com/mburumaxwell/dependabot-azure-devops/issues.

