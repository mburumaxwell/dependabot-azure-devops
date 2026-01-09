---
title: Hosted Service
description: Managed Dependabot updates without infrastructure management.
---

The Paklo hosted service provides a fully managed solution for running Dependabot updates on Azure DevOps repositories. No pipeline configuration, agent management, or Docker setup required.

## Why Use the Hosted Service?

- **Zero Infrastructure** - No agents, Docker, or pipeline configuration needed
- **Automatic Scheduling** - Updates run automatically based on your `dependabot.yml` schedule
- **Enterprise Features** - Organization-wide secrets and centralized management
- **Always Up-to-Date** - Latest Dependabot features and security updates applied automatically
- **Cost Effective** - No pipeline minutes consumed, predictable pricing

## Getting Started

### 1. Sign Up

Visit [www.paklo.app](https://www.paklo.app) and create an account using your Azure DevOps organization.

### 2. Connect Your Organization

Authorize Paklo to access your Azure DevOps organization. The hosted service requires:

- **Code (Read)** - Read repository contents and `dependabot.yml` files
- **Code (Write)** - Create branches for dependency updates
- **Pull Requests (Read & Write)** - Create and update pull requests

### 3. Configure Repositories

Select which repositories should have Dependabot updates enabled. For each repository:

1. Ensure a `dependabot.yml` file exists at `.github/dependabot.yml` or `.azuredevops/dependabot.yml`
2. Configure the [schedule](/docs/configuration#schedule) in your `dependabot.yml`
3. Enable the repository in the Paklo dashboard

### 4. Manage Secrets

Configure organization-wide secrets for private registries and authentication:

1. Go to **Dashboard → Secrets**
2. Add secrets referenced in your `dependabot.yml` files
3. Secrets are encrypted and available to all enabled repositories

## Configuration

### Repository Configuration

The hosted service reads your `dependabot.yml` configuration file:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
      time: "04:00"
      timezone: "America/New_York"
```

See [Configuration](/docs/configuration) for all options.

### Schedule

Unlike the extension or CLI, the hosted service **respects the schedule** in your `dependabot.yml`:

- `interval`: `daily`, `weekly`, `monthly`
- `time`: Time of day (HH:MM, 24-hour format)
- `day`: Day of week for weekly updates
- `timezone`: IANA timezone (e.g., `America/New_York`)

Updates run automatically at the specified time.

### Organization Secrets

Store authentication tokens and credentials securely:

```yaml
registries:
  npm-private:
    type: npm-registry
    url: https://npm.example.com
    token: ${{ NPM_TOKEN }}  # Resolved from organization secrets
```

## Features

### Automatic Updates

Updates run automatically according to your schedule. No manual triggers or pipeline configuration needed.

### Pull Request Management

- Creates pull requests for dependency updates
- React to `@dependabot comments`
- Automatic merge conflict resolution

### Security Updates

Enable [security-only updates](/docs/security-advisories) by setting `open-pull-requests-limit: 0`:

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 0  # Only security updates
```

Requires a GitHub token in integration settings.

### Status Dashboard

Monitor the health of your Dependabot updates:

- Last successful run
- Failed updates with error details
- Open pull requests
- Skipped updates

## Troubleshooting

### Updates Not Running

If updates aren't running automatically:

1. **Check schedule** - Verify `schedule` in your `dependabot.yml`
2. **Check repository status** - Ensure repository is enabled in dashboard
3. **Review logs** - Check activity logs for errors
4. **Verify permissions** - Ensure Paklo has required permissions

### Pull Requests Not Created

If updates run but PRs aren't created:

1. **Check branch permissions** - Ensure Paklo can create branches
2. **Review ignore rules** - Check `ignore` configuration
3. **Check open PR limit** - Verify `open-pull-requests-limit` setting
4. **Review logs** - Check for authentication errors

### Authentication Failures

If private registries fail:

1. **Verify secrets** - Check secrets are configured in organization settings
2. **Check secret names** - Ensure `${{ SECRET_NAME }}` matches configured secrets
3. **Test credentials** - Verify credentials work outside Dependabot
4. **Review logs** - Check error messages in activity logs

## Migrating from Extension

To migrate from the Azure DevOps extension to hosted:

1. **Keep your `dependabot.yml`** - No configuration changes needed
2. **Disable pipeline** - Stop or delete your Dependabot pipeline
3. **Enable in Paklo** - Activate repositories in the hosted dashboard
4. **Migrate secrets** - Move pipeline variables to organization secrets
5. **Test** - Wait for scheduled run or trigger manually
