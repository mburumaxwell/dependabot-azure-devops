---
title: Azure DevOps Extension
description: Complete guide for using, troubleshooting, and developing the Azure DevOps extension.
---

The Azure DevOps extension allows you to run Dependabot updates directly in your Azure Pipelines. This runs Dependabot in your pipeline agents using Docker containers.

## Installation

Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=tingle-software.dependabot).

## Quick Start

Create a pipeline with the `dependabot@2` task:

```yaml
trigger: none # Disable CI trigger

schedules:
  - cron: '0 0 * * 0' # Weekly on Sunday at midnight UTC
    always: true # Run even when there are no code changes
    branches:
      include:
        - main
    batch: true
    displayName: Weekly Dependabot

pool:
  vmImage: 'ubuntu-latest' # Requires macOS or Ubuntu (Windows is not supported)

steps:
  - task: dependabot@2
    inputs:
      mergeStrategy: 'squash'
```

### Requirements

The task requires:

- [Docker](https://docs.docker.com/engine/install/) with Linux containers

Microsoft-hosted agents like [`ubuntu-latest`](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md) include all requirements.

### Configuration File

Create a `dependabot.yml` file at `.github/dependabot.yml` or `.azuredevops/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

See [Configuration](/docs/configuration) for all options.

## Task Parameters

### Basic Parameters

| Input | Description | Default |
| ----- | ----------- | ------- |
| `dryRun` | Test logic without creating/updating PRs | `false` |
| `setAutoComplete` | Enable auto-complete on created PRs | `false` |
| `mergeStrategy` | Merge strategy: `squash`, `rebase`, `merge` | `squash` |
| `autoApprove` | Automatically approve created PRs | `false` |

### Authentication Parameters

| Input | Description |
| ----- | ----------- |
| `azureDevOpsServiceConnection` | Service connection for Azure DevOps access |
| `azureDevOpsAccessToken` | PAT for Azure DevOps (alternative to service connection) |
| `gitHubConnection` | GitHub service connection for rate limiting/security advisories |
| `gitHubAccessToken` | GitHub PAT (alternative to GitHub connection) |

Required permissions for Azure DevOps PAT:

- Code (Full)
- Pull Requests Threads (Read & Write)

### Customization Parameters

| Input | Description | Default |
| ----- | ----------- | ------- |
| `authorEmail` | Email for commit author | `noreply@github.com` |
| `authorName` | Name for commit author | `dependabot[bot]` |
| `autoCompleteIgnoreConfigIds` | Policy IDs to ignore for auto-complete | - |
| `autoApproveUserToken` | PAT for auto-approval (different user) | - |

### Advanced Parameters

| Input | Description |
| ----- | ----------- |
| `targetProjectName` | Target project (for multi-project pipelines) |
| `targetRepositoryName` | Target repository (for multi-repo pipelines) |
| `targetUpdateIds` | Semicolon-separated update IDs to run |
| `experiments` | Comma-separated Dependabot experiments |
| `dependabotUpdaterImage` | Custom updater Docker image |
| `dependabotCliApiListeningPort` | Fixed port for Dependabot CLI API |

### Examples

#### Auto-Complete with Squash Merge

```yaml
- task: dependabot@2
  inputs:
    setAutoComplete: true
    mergeStrategy: 'squash'
    autoCompleteIgnoreConfigIds: '1,2'  # Ignore optional policies
```

#### Auto-Approve with Different User

```yaml
variables:
  APPROVER_PAT: $(ApproverPersonalAccessToken)

steps:
  - task: dependabot@2
    inputs:
      autoApprove: true
      autoApproveUserToken: $(APPROVER_PAT)
```

#### Using Service Connection

```yaml
- task: dependabot@2
  inputs:
    azureDevOpsServiceConnection: 'my-service-connection'
    gitHubConnection: 'github-connection'
```

#### Security-Only Updates

```yaml
# dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 0  # Security-only

# Pipeline
- task: dependabot@2
  inputs:
    gitHubAccessToken: $(GITHUB_TOKEN)  # Required for security advisories
```

#### Multi-Repository Pipeline

```yaml
steps:
  - task: dependabot@2
    displayName: 'Update repo-1'
    inputs:
      targetProjectName: 'my-project'
      targetRepositoryName: 'repo-1'
  
  - task: dependabot@2
    displayName: 'Update repo-2'
    inputs:
      targetProjectName: 'my-project'
      targetRepositoryName: 'repo-2'
```

#### Custom Experiments

```yaml
- task: dependabot@2
  inputs:
    experiments: 'tidy=true,vendor=true,goprivate=*'
```

See [Experiments](/docs/experiments) for usage patterns.

## Scheduling

Since the `schedule` in `dependabot.yml` is not used (required for schema conformity only), use [Azure Pipelines scheduled triggers](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/scheduled-triggers):

```yaml
schedules:
  # Daily at 2 AM UTC
  - cron: '0 2 * * *'
    displayName: Daily Dependabot
    branches:
      include:
        - main
    always: true

  # Weekly on Monday at 8 AM UTC
  - cron: '0 8 * * 1'
    displayName: Weekly Dependabot
    branches:
      include:
        - develop
    always: true
```

## Troubleshooting issues

Dependabot will log more diagnostic information when [verbose logs are enabled](https://learn.microsoft.com/en-us/azure/devops/pipelines/troubleshooting/review-logs?view=azure-devops&tabs=windows-agent#configure-verbose-logs); i.e. `System.Debug` variable is set to `true`.

:::warning
When sharing pipeline logs, please be aware that the **task log contains potentially sensitive information** such as your DevOps organization name, project names, repository names, private package feeds URLs, list of used dependency names/versions, and the contents of any dependency files that are updated (e.g. `package.json`, `*.csproj`, etc). The Flame Graph report does **not** contain any sensitive information about your DevOps environment.
:::

:::info
To mask environment secrets from the task log, set the `System.Secrets` variable to `true` in your pipeline.
:::
