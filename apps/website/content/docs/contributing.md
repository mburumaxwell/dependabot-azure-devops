---
title: Contributing
description: Guidelines for developing and submitting changes.
---

We welcome contributions to the Dependabot for Azure DevOps project.

## Development Setup

- Install [Node.js](https://nodejs.org) 22 or later.
- Use [pnpm](https://pnpm.io) (the repository uses `pnpm@10`).
- Run `pnpm install` to fetch dependencies.

## Quality Checks

Before opening a pull request run:

```bash
pnpm lint
pnpm test
pnpm format:check
```

Optional Git hooks can be enabled to run these checks automatically:

```bash
pnpm dlx husky
```

## Submitting Changes

1. Fork the repository and create your branch from `main`.
2. Make your changes and ensure all quality checks pass.
3. Commit using clear messages and open a pull request.

For more details see the [CONTRIBUTING guide](https://github.com/mburumaxwell/dependabot-azure-devops/blob/main/CONTRIBUTING.MD) and the [extension development guide](https://github.com/mburumaxwell/dependabot-azure-devops/blob/main/docs/extensions/azure.md#development-guide).

