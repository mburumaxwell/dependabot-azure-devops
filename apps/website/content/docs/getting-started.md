---
title: Getting Started
description: Configure Dependabot in an Azure Pipelines YAML pipeline.
---

Dependabot runs as a task inside your pipeline. Follow these steps to enable it:

1. Install the **Dependabot** extension from the Azure DevOps Marketplace.
2. Add a `.azuredevops/dependabot.yml` or `.github/dependabot.yml` file to your repository following the [official configuration](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference).
3. Create a pipeline that includes the `dependabot@2` task. The agent must have Docker installed; the Microsoft-hosted `ubuntu-latest` image already includes it.

```yaml
trigger: none # Disable CI trigger

schedules:
  - cron: '0 0 * * 0' # weekly on sunday at midnight UTC
    always: true
    branches:
      include:
        - master
    batch: true
    displayName: Weekly

pool:
  vmImage: 'ubuntu-latest' # requires macOS or Ubuntu (Windows is not supported)

steps:
  - task: dependabot@2
    inputs:
      mergeStrategy: 'squash'
```

The task accepts many inputs such as `dryRun`, `setAutoComplete`, and `mergeStrategy`. See the [task parameters](https://github.com/mburumaxwell/dependabot-azure-devops/blob/main/extensions/azure/README.md#task-parameters) for the full list.
