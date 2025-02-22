# Dependabot for Azure DevOps

This repository contains tools for updating dependencies in Azure DevOps repositories using [Dependabot](https://dependabot.com).

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/tinglesoftware/dependabot-azure-devops/updater.yml?branch=main&style=flat-square)
[![Release](https://img.shields.io/github/release/tinglesoftware/dependabot-azure-devops.svg?style=flat-square)](https://github.com/tinglesoftware/dependabot-azure-devops/releases/latest)
[![license](https://img.shields.io/github/license/tinglesoftware/dependabot-azure-devops.svg?style=flat-square)](LICENSE)

In this repository you'll find:

1. Azure DevOps [Extension](https://marketplace.visualstudio.com/items?itemName=tingle-software.dependabot), [source code](./extension) and [docs](./docs/extension.md).
1. Dependabot Server, [source code](./server/) and [docs](./docs/server.md).
1. Dependabot Updater image, [Dockerfile](./updater/Dockerfile), [source code](./updater/) and [docs](./docs/updater.md). **(deprecated)**

> [!IMPORTANT]
> The Azure pipelines task is currently undergoing a major version increment (V1 → V2); See the [migration guide](./docs/migrations/v1-to-v2.md#summary-of-changes-v1--v2) for more details and progress updates.

## Table of Contents
- [Getting started](#getting-started)
- [Using a configuration file](#using-a-configuration-file)
- [Configuring private feeds and registries](#configuring-private-feeds-and-registries)
- [Configuring security advisories and known vulnerabilities](#configuring-security-advisories-and-known-vulnerabilities)
- [Configuring experiments](#configuring-experiments)
- [Configuring assignees and reviewers](#configuring-assignees-and-reviewers)
- [Unsupported features and configurations](#unsupported-features-and-configurations)
   * [Dependabot Task](#dependabot-task)
      + [dependabot@2](#dependabot2)
      + [dependabot@1](#dependabot1)
   * [Dependabot Updater Docker image](#dependabot-updater-docker-image)
   * [Dependabot Server](#dependabot-server)
- [Migration Guide](#migration-guide)
- [Contributing](#contributing)
   * [Reporting issues and feature requests](#reporting-issues-and-feature-requests)
   * [Submitting pull requests](#submitting-pull-requests)
- [Acknowledgements](#acknowledgements)

## Getting started

Dependabot for Azure DevOps must be explicitly configured to run in your organisation; creating a `dependabot.yml` file alone is **not** enough to enable updates. There are two ways to enable Dependabot, using:

- [Azure DevOps Extension](https://marketplace.visualstudio.com/items?itemName=tingle-software.dependabot) - Ideal if you want to get Dependabot running with minimal administrative effort. The extension can run directly inside your existing pipeline agents and doesn't require hosting of any additional services. Because the extension runs in pipelines, this option does **not** scale well if you have a large number of projects and repositories.

  <details>
  <summary>Example:</summary>

  ```yaml
  trigger: none # Disable CI trigger

  schedules:
  - cron: '0 0 * * 0' # weekly on sunday at midnight UTC
    always: true # run even when there are no code changes
    branches:
      include:
        - master
    batch: true
    displayName: Weekly

  pool:
    vmImage: 'ubuntu-latest' # requires macos or ubuntu (windows is not supported)

  steps:
  - task: dependabot@2
    inputs:
      mergeStrategy: 'squash'
  ```
  See [task requirements](/extension/README.md#task-requirements) and [task parameters](/extension/README.md#task-parameters) for more information.

  </details>

- [Hosted Server](./docs/server.md) - Ideal if you have a large number of projects and repositories or prefer to run Dependabot as a managed service instead of using pipeline agents. See [why should I use the server?](./docs/server.md#why-should-i-use-the-server) for more info.

> [!NOTE]
> A hosted version is available to sponsors (most, but not all). It includes hassle free runs where the infrastructure is maintained for you. Much like the GitHub hosted version. Alternatively, you can run and host your own [self-hosted server](./docs/server.md). Once you sponsor, you can send out an email to a maintainer or wait till they reach out. This is meant to ease the burden until GitHub/Azure/Microsoft can get it working natively (which could also be never) and hopefully for free.

## Using a configuration file

Similar to the GitHub-hosted version, Dependabot is configured using a [dependabot.yml file](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file) located at `.azuredevops/dependabot.yml` or `.github/dependabot.yml` in your repository. 

Most [official configuration options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file) are supported; See [unsupported features and configurations](#unsupported-features-and-configurations) for more details. 

## Configuring private feeds and registries

Besides accessing the repository, sometimes private feeds/registries may need to be accessed. For example a private NuGet feed or a company internal docker registry.

Private registries are configured in `dependabot.yml`, refer to the [official documentation](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#configuration-options-for-private-registries).


<details open>
<summary>Example:</summary>

```yml
version: 2
registries:

  # Azure DevOps private feed, all views
  my-analyzers:
    type: nuget-feed
    url: https://dev.azure.com/organization2/_packaging/my-analyzers/nuget/v3/index.json
    token: PAT:${{ MY_DEPENDABOT_ADO_PAT }}

  # Azure DevOps private feed, "Release" view only
  my-Extern@Release: 
    type: nuget-feed
    url: https://dev.azure.com/organization1/_packaging/my-Extern@Release/nuget/v3/index.json
    token: PAT:${{ MY_DEPENDABOT_ADO_PAT }}

  # Artifactory private feed using PAT
  artifactory:
    type: nuget-feed
    url: https://artifactory.com/api/nuget/v3/myfeed
    token: PAT:${{ MY_DEPENDABOT_ARTIFACTORY_PAT }}

  # Other private feed using basic auth (username/password)
  telerik:
    type: nuget-feed
    url: https://nuget.telerik.com/v3/index.json
    username: ${{ MY_TELERIK_USERNAME }}
    password: ${{ MY_TELERIK_PASSWORD }}
    token: ${{ MY_TELERIK_USERNAME }}:${{ MY_TELERIK_PASSWORD }}

updates:
  ...
```

</details>

Note when using authentication secrets in configuration files:

> [!IMPORTANT]
> `${{ VARIABLE_NAME }}` notation is used liked described [here](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/managing-encrypted-secrets-for-dependabot)
BUT the values will be used from pipeline environment variables. Template variables are not supported for this replacement. Replacement only works for values considered secret in the registries section i.e. `username`, `password`, `token`, and `key`

> [!IMPORTANT]
> When using an Azure DevOps Artifact feed, the token format must be `PAT:${{ VARIABLE_NAME }}` where `VARIABLE_NAME` is a pipeline/environment variable containing the PAT token. The PAT must:
>    1. Have `Packaging (Read)` permission.
>    2. Be issued by a user with permission to the feed either directly or via a group. An easy way for this is to give `Contributor` permissions the `[{project_name}]\Contributors` group under the `Feed Settings -> Permissions` page. The page has the url format: `https://dev.azure.com/{organization}/{project}/_packaging?_a=settings&feed={feed-name}&view=permissions`.

## Configuring security advisories and known vulnerabilities

Security-only updates is a mechanism to only create pull requests for dependencies with vulnerabilities by updating them to the earliest available non-vulnerable version. [Security updates are supported in the same way as the GitHub-hosted version](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates#overriding-the-default-behavior-with-a-configuration-file) provided that a GitHub access token with `public_repo` access is provided in the `gitHubAccessToken` or `gitHubConnection` task inputs. 

You can provide extra security advisories, such as those for an internal dependency, in a JSON file via the `securityAdvisoriesFile` task input e.g. `securityAdvisoriesFile: '$(Pipeline.Workspace)/advisories.json'`. An example file is available in [./advisories-example.json](./advisories-example.json).

## Configuring experiments
Dependabot uses an internal feature flag system called "experiments". Typically, experiments represent new features or changes in logic which are still being internally tested before becoming generally available. In some cases, you may want to opt-in to experiments to work around known issues or to opt-in to preview features ahead of general availability (GA).

Experiments vary depending on the package ecyosystem used; They can be enabled using the `experiments` task input with a comma-seperated list of key/value pairs representing the experiments e.g. `experiments: 'tidy=true,vendor=true,goprivate=*'`.

By default, the enabled experiments will mirror the GitHub-hosted version of Dependabot, which can be found [here](/extension/tasks/dependabotV2/utils/dependabot/experiments.ts). Specifying experiments in the task input parameters will override all defaults.

<details open>
<summary>List of known experiments:</summary>

|Package Ecosystem|Experiment Name|Value Type|More Information|
|--|--|--|--|
| All | grouped_updates_experimental_rules | true/false | https://github.com/dependabot/dependabot-core/pull/7581 |
| All | grouped_security_updates_disabled | true/false | https://github.com/dependabot/dependabot-core/pull/8529 |
| All | lead_security_dependency | true/false | https://github.com/dependabot/dependabot-core/pull/10727 |
| All | record_ecosystem_versions | true/false | https://github.com/dependabot/dependabot-core/pull/7517 |
| All | enable_record_ecosystem_meta | true/false | https://github.com/dependabot/dependabot-core/pull/10905 |
| All | record_update_job_unknown_error | true/false | https://github.com/dependabot/dependabot-core/pull/8144 |
| All | dependency_change_validation | true/false | https://github.com/dependabot/dependabot-core/pull/9888 |
| All | add_deprecation_warn_to_pr_message | true/false | https://github.com/dependabot/dependabot-core/pull/10421 |
| All | threaded_metadata | true/false | https://github.com/dependabot/dependabot-core/pull/9485 |
| All | enable_shared_helpers_command_timeout | true/false | https://github.com/dependabot/dependabot-core/pull/11125 |
| All | allow_refresh_for_existing_pr_dependencies | true/false | https://github.com/dependabot/dependabot-core/pull/11382 |
| Bun | enable_bun_ecosystem | true/false | https://github.com/dependabot/dependabot-core/pull/11446 |
| Composer | exclude_local_composer_packages | true/false| https://github.com/dependabot/dependabot-core/pull/11527 |
| Go | tidy | true/false | |
| Go | vendor | true/false | |
| Go | goprivate | string | |
| NPM | enable_corepack_for_npm_and_yarn | true/false | https://github.com/dependabot/dependabot-core/pull/10985 |
| NPM | npm_fallback_version_above_v6 | true/false | https://github.com/dependabot/dependabot-core/pull/10757 |
| NPM | npm_v6_deprecation_warning | true/false | https://github.com/dependabot/dependabot-core/pull/11112 |
| NPM | npm_v6_unsupported_error | true/false | https://github.com/dependabot/dependabot-core/pull/11112 |
| NPM | enable_engine_version_detection | true/false | https://github.com/dependabot/dependabot-core/pull/11392 |
| NPM | avoid_duplicate_updates_package_json | true/false | https://github.com/dependabot/dependabot-core/pull/11423 |
| NuGet | nuget_native_analysis | true/false | https://github.com/dependabot/dependabot-core/pull/10025 |
| NuGet | nuget_native_updater | true/false | https://github.com/dependabot/dependabot-core/pull/10521 |
| NuGet | nuget_legacy_dependency_solver | true/false | https://github.com/dependabot/dependabot-core/pull/10671 |
| NuGet | nuget_use_direct_discovery | true/false | https://github.com/dependabot/dependabot-core/pull/10597 |
| NuGet | nuget_install_dotnet_sdks | true/false | https://github.com/dependabot/dependabot-core/pull/11090 |

> [!NOTE]
> Dependabot experiment names are not [publicly] documented and these may be out-of-date at the time of reading. To find the latest list of experiments, search the `dependabot-core` GitHub repository using queries like ["enabled?(x)"](https://github.com/search?q=repo%3Adependabot%2Fdependabot-core+%2Fenabled%5CW%5C%28.*%5C%29%2F&type=code) and ["options.fetch(x)"](https://github.com/search?q=repo%3Adependabot%2Fdependabot-core+%2Foptions%5C.fetch%5C%28.*%2C%2F&type=code). 

</details>

## Configuring assignees and reviewers
Dependabot supports [`assignees`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#assignees) and [`reviewers`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#reviewers). However, Azure DevOps does not have the concept of pull request assignees. To work around this:

- [`assignees`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#assignees) are treated as **required** pull request reviewers.
- [`reviewers`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#reviewers) are treated as **optional** pull request reviewers.

The following values can be used as assignees or reviewers:

- User GUID
- User username
- User email address
- User full display name
- Group name
- Team name

## Unsupported features and configurations
We aim to support all [official configuration options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file), but there are some limitations:

### Dependabot Task

#### `dependabot@2`
- [`schedule`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#scheduleinterval) is ignored, use [pipeline scheduled triggers](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/scheduled-triggers?view=azure-devops&tabs=yaml#scheduled-triggers) instead.
- [`securityAdvisoriesFile`](#configuring-security-advisories-and-known-vulnerabilities) task input is not yet supported.

#### `dependabot@1`
- [`schedule`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#scheduleinterval) is ignored, use [pipeline scheduled triggers](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/scheduled-triggers?view=azure-devops&tabs=yaml#scheduled-triggers) instead.
- [`directories`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#directories) are only supported if task input `useUpdateScriptVNext: true` is set.
- [`groups`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#groups) are only supported if task input `useUpdateScriptVNext: true` is set.
- [`ignore`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#ignore) may not behave to official specifications unless task input `useUpdateScriptVNext: true` is set. If you are having issues, search for related issues such as <https://github.com/tinglesoftware/dependabot-azure-devops/pull/582> before creating a new issue.
- [`assignees`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#assignees) and [`reviewers`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#reviewers) must be a list of user guids or email addresses; group/team names are not supported.
- Private feed/registry authentication may not work with all package ecyosystems. Support is _slightly_ improved when task input `useUpdateScriptVNext: true` is set, but not still not fully supported. See [problems with authentication](https://github.com/tinglesoftware/dependabot-azure-devops/discussions/1317) for more.

### Dependabot Updater Docker Image
- `DEPENDABOT_ASSIGNEES` and `DEPENDABOT_REVIEWERS` must be a list of user guids; email addresses and group/team names are not supported.
- Private feed/registry authentication may not work with all package ecyosystems. See [problems with authentication](https://github.com/tinglesoftware/dependabot-azure-devops/discussions/1317) for more.

### Dependabot Server

- [`directories`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#directories) are not supported.
- [`groups`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#groups) are not supported.
- [`assignees`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#assignees) and [`reviewers`](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#reviewers) must be a list of user guids; email addresses and group/team names are not supported.
- Private feed/registry authentication may not work with all package ecyosystems. See [problems with authentication](https://github.com/tinglesoftware/dependabot-azure-devops/discussions/1317) for more.

## Migration Guide
- [Extension Task V1 → V2](./docs/migrations/v1-to-v2.md)

## Contributing

:wave: Want to give us feedback on Dependabot for Azure DevOps, or contribute to it? That's great - thank you so much!

### Reporting issues and feature requests

Please leave all issues, bugs, and feature requests on the [issues page](https://github.com/tinglesoftware/dependabot-azure-devops/issues). We'll respond ASAP!
Use the [discussions page](https://github.com/tinglesoftware/dependabot-azure-devops/discussions) for all other questions and comments.

### Submitting pull requests

Please refer to the [contributing guidelines](./CONTRIBUTING.MD) for more information on how to get started.

## Acknowledgements

The work in this repository is based on inspired and occasionally guided by some predecessors in the same area:

1. Official Script support: [code](https://github.com/dependabot/dependabot-script)
2. Andrew Craven's work: [blog](https://medium.com/@acraven/updating-dependencies-in-azure-devops-repos-773cbbb6029d), [code](https://github.com/acraven/azure-dependabot)
3. Chris' work: [code](https://github.com/chris5287/dependabot-for-azuredevops)
4. andrcun's work on GitLab: [code](https://gitlab.com/dependabot-gitlab/dependabot)
5. WeWork's work for GitLab: [code](https://github.com/wemake-services/kira-dependencies)
