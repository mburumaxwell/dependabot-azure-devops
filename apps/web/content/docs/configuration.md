---
title: Configuration
description: Azure DevOps-specific configuration differences and examples for dependabot.yml.
---

Paklo uses the standard GitHub Dependabot configuration format. For complete configuration options, see [GitHub's Dependabot Configuration Reference](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file). This page only documents Azure DevOps-specific differences and behaviors.

## File Location

Place your configuration file at:

- `.github/dependabot.{yml,yaml}` (recommended)
- `.azuredevops/dependabot.{yml,yaml}` (alternative)

## Basic Example

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

## Azure DevOps-Specific Behaviors

### Schedule

Although this is required for your configuration file to be parsed correctly, it is only used in the hosted version. For the free extension or CLI, you are responsible for scheduling at an appropriate time.

You can use [pipeline scheduled triggers](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/scheduled-triggers?view=azure-devops&tabs=yaml#scheduled-triggers) when using the extension.

### Assignees

Azure DevOps doesn't support pull request assignees. The `assignees` field is implemented as optional reviewers:

```yaml
assignees:
  - "user1"
  - "user2"
```

These users will be added as optional reviewers.

:::info
For required reviewers, use [branch policies in Azure DevOps](https://learn.microsoft.com/en-us/azure/devops/repos/git/branch-policies) as you would have them configured for other types of pull requests.
:::

### Variable Substitution

Use `${{ VARIABLE_NAME }}` syntax for secrets in the `registries` section:

```yaml
registries:
  private-nuget:
    type: nuget-feed
    url: https://nuget.example.com
    token: ${{ NUGET_TOKEN }}
```

:::info
Variable substitution only works for secret values: `username`, `password`, `token`, `key`
Environment variables and pipeline variables are automatically available when using the extension or CLI.
The hosted version offers secure organization secrets.
:::

### Azure DevOps PAT Format

For Azure DevOps Artifacts feeds, you may need to prefix tokens with `PAT:` or `:` to use basic authentication:

```yaml
registries:
  azure-artifacts:
    type: nuget-feed
    url: https://dev.azure.com/org/_packaging/feed/nuget/v3/index.json
    token: PAT:${{ AZDO_PAT }}
```

## Common Configuration Examples

### Monorepo with Multiple Ecosystems

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    labels: ["dependencies", "frontend"]

  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    labels: ["dependencies", "backend"]

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```

### With Private Registry

```yaml
version: 2
registries:
  npm-private:
    type: npm-registry
    url: https://npm.example.com
    token: ${{ NPM_TOKEN }}

updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    registries:
      - npm-private
```

:::info
For more on configuring private package registries see [Private Registries](/docs/private-registries)
:::

### Security-Only Updates

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 0  # Only security updates
    assignees:
      - "security-team"
```

:::info
For more on security-only updates and custom advisories see [Security Advisories](/docs/security-advisories)
:::

### Grouped Updates

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      development:
        dependency-type: "development"
      production-minor:
        update-types: ["minor", "patch"]
        dependency-type: "production"
```
