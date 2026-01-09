---
title: Getting Started
description: Run Dependabot on Azure DevOps repositories with the extension, CLI, or hosted service.
---

Paklo brings automated dependency updates to Azure DevOps repositories using Dependabot. Choose the deployment method that best fits your needs:

## Deployment Options

### Azure DevOps Extension

Run Dependabot in your Azure Pipelines with full control over scheduling and configuration.

**Best for:** Teams who want to manage updates in their existing pipeline infrastructure.

[Learn more →](/docs/extensions/azure)

### CLI

Run Dependabot locally or in any CI/CD environment with Docker support.

**Best for:** Local testing, custom automation, or non-Azure DevOps CI/CD systems.

[Learn more →](/docs/cli)

### Hosted Service

Fully managed Dependabot updates without infrastructure management.

**Best for:** Teams who want automatic updates without pipeline configuration or maintenance.

[Learn more →](/docs/hosted)

## Quick Start: Azure DevOps Extension

1. Install the [Dependabot extension](https://marketplace.visualstudio.com/items?itemName=tingle-software.dependabot) from the Visual Studio Marketplace.

2. Create a `dependabot.yml` file at `.github/dependabot.yml` or `.azuredevops/dependabot.yml`:

    ```yaml
    version: 2
    updates:
      - package-ecosystem: "npm"
        directory: "/"
        schedule:
          interval: "weekly"
    ```

3. Create a pipeline with the `dependabot@2` task:

    ```yaml
    trigger: none # Disable CI trigger

    schedules:
      - cron: '0 0 * * 0' # Weekly on Sunday at midnight UTC
        always: true
        branches:
          include:
            - main
        batch: true
        displayName: Weekly Dependabot

    pool:
      vmImage: 'ubuntu-latest' # Requires macOS or Ubuntu (Windows not supported)

    steps:
      - task: dependabot@2
        inputs:
          mergeStrategy: 'squash'
    ```

The task accepts many inputs such as `dryRun`, `setAutoComplete`, and `mergeStrategy`. See [Azure DevOps Extension](/docs/extensions/azure) for the full list.

## Configuration

All deployment methods use the same `dependabot.yml` configuration format. See [Configuration](/docs/configuration) for complete documentation.

## Next Steps

- [Configuration](/docs/configuration) - Complete `dependabot.yml` reference
- [Private Registries](/docs/private-registries) - Configure private package feeds
- [Security Advisories](/docs/security-advisories) - Security-only updates
- [Troubleshooting](/docs/troubleshooting) - Common issues and solutions
