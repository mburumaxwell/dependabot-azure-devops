---
title: Private Registries and Feeds
description: Configure authentication for private package registries, feeds, and repositories.
---

Dependabot can authenticate to private package sources to access internal dependencies. See [GitHub's Dependabot Private Registry Documentation](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/guidance-for-the-configuration-of-private-registries). This page only documents Paklo-specific differences.

## Basic Configuration

Define registries in the top-level `registries` section:

```yaml
version: 2
registries:
  my-private-npm:
    type: npm-registry
    url: https://npm.example.com
    token: ${{ NPM_TOKEN }}

updates:
  - package-ecosystem: "npm"
    directory: "/"
    registries:
      - my-private-npm
    schedule:
      interval: "weekly"
```

## Azure DevOps-Specific: Variable Substitution

Use `${{ VARIABLE_NAME }}` syntax for secrets:

```yaml
registries:
  my-registry:
    type: npm-registry
    url: https://npm.example.com
    token: ${{ NPM_TOKEN }}
```

**Important differences from GitHub:**

- ❌ Azure DevOps template variables (`$(VariableName)`) are **not** supported
- ✅ Use `${{ VARIABLE_NAME }}` notation instead
- Variable substitution only works for: `username`, `password`, `token`, `key`

**Variable sources:**

- CLI: Environment variables, manual prompt input
- Extension: Pipeline variables, variable groups
- Hosted: Web interface configuration

## Azure DevOps-Specific: Artifacts Configuration

### Token Format

**Important:** Use the `PAT:` prefix for Azure DevOps feeds:

```yaml
registries:
  azure-artifacts:
    type: nuget-feed
    url: https://pkgs.dev.azure.com/org/_packaging/feed/nuget/v3/index.json
    token: PAT:${{ AZDO_PAT }}
```

### Feed URL Format

```yaml
# All views
url: https://pkgs.dev.azure.com/{org}/_packaging/{feed}/nuget/v3/index.json

# Specific view
url: https://pkgs.dev.azure.com/{org}/_packaging/{feed}@{view}/nuget/v3/index.json
```

### PAT Permissions

The Personal Access Token must have:

- **Packaging (Read)** permission
- Access to the feed (granted directly or via `[{project}]\Contributors` group)

## Example: Azure DevOps Artifacts with npm

```yaml
version: 2
registries:
  azure-nuget:
    type: nuget-feed
    url: https://pkgs.dev.azure.com/org/_packaging/feed/nuget/v3/index.json
    token: PAT:${{ AZDO_PAT }}
  
  npm-private:
    type: npm-registry
    url: https://npm.example.com
    token: ${{ NPM_TOKEN }}

updates:
  - package-ecosystem: "nuget"
    directory: "/"
    registries:
      - azure-nuget
    schedule:
      interval: "weekly"
  
  - package-ecosystem: "npm"
    directory: "/frontend"
    registries:
      - npm-private
    schedule:
      interval: "weekly"
```

## Troubleshooting

### Authentication Failures

Common issues:

1. Incorrect or expired credentials
2. Missing token permissions
3. Self-signed certificates - see [Custom CA Certificates](/docs/custom-ca-certificates)
4. For Azure DevOps: Missing `PAT:` prefix or wrong feed URL

**Debug:**

```bash
paklo run --debug ...
```

### Azure DevOps Feed Issues

1. **Check PAT format** - Must use `PAT:${{ VARIABLE }}`
2. **Verify feed URL** - Use full v3 API URL format
3. **Check permissions** - PAT needs Packaging (Read)
4. **Test manually:**

   ```bash
   curl -u "user:$AZDO_PAT" https://pkgs.dev.azure.com/org/_packaging/feed/nuget/v3/index.json
   ```
