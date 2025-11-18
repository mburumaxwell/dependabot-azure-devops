# Paklo Core

The shared toolkit for Paklo, ensuring consistent integrations with Azure DevOps, GitHub, Dependabot primitives, logging, HTTP helpers, and shared utilities.

## Internal Surface Area

- This package is not a public API. Names, exports, and behaviors may change at any time as we evolve the architecture.
- Use it only from within this monorepo. External consumers should rely on higher-level packages such as `@paklo/cli`.
- When contributing, prefer adding well-tested, isolated helpers so they can be reused by downstream packages.

## Development

- `pnpm dev` — watch mode via `tsdown`
- `pnpm test` — run the Vitest suite (fixtures live under `packages/core/fixtures`)
- `pnpm lint` — run Biome checks
- `pnpm build` — build distributable artifacts
