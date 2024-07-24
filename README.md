# Dependabot for Azure DevOps

This repository contains tools for updating dependencies in Azure DevOps repositories using [Dependabot](https://dependabot.com).

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/tinglesoftware/dependabot-azure-devops/updater.yml?branch=main&style=flat-square)
[![Release](https://img.shields.io/github/release/tinglesoftware/dependabot-azure-devops.svg?style=flat-square)](https://github.com/tinglesoftware/dependabot-azure-devops/releases/latest)
[![license](https://img.shields.io/github/license/tinglesoftware/dependabot-azure-devops.svg?style=flat-square)](LICENSE)

In this repository you'll find:

1. Dependabot [updater](./updater) in Ruby. See [docs](./docs/updater.md).
2. Dockerfile and build/image for running the updater via Docker [here](./updater/Dockerfile).
3. Dependabot [server](./server/) in .NET/C#. See [docs](./docs/server.md).
4. Azure DevOps [Extension](https://marketplace.visualstudio.com/items?itemName=tingle-software.dependabot) and [source](./extension). See [docs](./docs/extension.md).

> The hosted version is available to sponsors (most, but not all). It includes hustle free runs where the infrastructure is maintained for you. Much like the GitHub hosted version. Alternatively, you can run and host your own [server](./docs/server.md). Once you sponsor, you can send out an email to an maintainer or wait till they reach out. This is meant to ease the burden until GitHub/Azure/Microsoft can get it working natively (which could also be never) and hopefully for free.

## Using a configuration file

Similar to the GitHub native version where you add a `.azuredevops/dependabot.yml` or `.github/dependabot.yml` file, this repository adds support for the same official [configuration options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file) via a file located at `.azuredevops/dependabot.yml` or `.github/dependabot.yml`. This support is only available in the Azure DevOps extension and the [managed version](https://managd.dev). However, the extension does not currently support automatically picking up the file, a pipeline is still required. See [docs](./extension/README.md#usage).

We are well aware that ignore conditions are not explicitly passed and passed on from the extension/server to the container. It is intentional. The ruby script in the docker container does it automatically. If you are having issues, search for related issues such as https://github.com/tinglesoftware/dependabot-azure-devops/pull/582 before creating a new issue. You can also test against various reproductions such as https://dev.azure.com/tingle/dependabot/_git/repro-582

## Credentials for private registries and feeds

Besides accessing the repository only, sometimes private feeds/registries may need to be accessed.
For example a private NuGet feed or a company internal docker registry.

Adding configuration options for private registries is setup in `dependabot.yml`
according to the dependabot [description](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#configuration-options-for-private-registries).

Example:

```yml
version: 2
registries:
  my-Extern@Release:
    type: nuget-feed
    url: https://dev.azure.com/organization1/_packaging/my-Extern@Release/nuget/v3/index.json
    token: PAT:${{MY_DEPENDABOT_ADO_PAT}}
  my-analyzers:
    type: nuget-feed
    url: https://dev.azure.com/organization2/_packaging/my-analyzers/nuget/v3/index.json
    token: PAT:${{MY_OTHER_PAT}}
  artifactory:
    type: nuget-feed
    url: https://artifactory.com/api/nuget/v3/myfeed
    token: PAT:${{MY_ARTIFACTORY_PAT}}
  telerik:
    type: nuget-feed
    url: https://nuget.telerik.com/v3/index.json
    username: ${{MY_TELERIK_USERNAME}}
    password: ${{MY_TELERIK_PASSWORD}}
    token: ${{MY_TELERIK_USERNAME}}:${{MY_TELERIK_PASSWORD}}
updates:
  ...
```

Note:

1. `${{VARIABLE_NAME}}` notation is used liked described [here](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/managing-encrypted-secrets-for-dependabot)
BUT the values will be used from Environment Variables in the pipeline/environment. Template variables are not supported for this replacement. Replacement only works for values considered secret in the registries section i.e. `username`, `password`, `token`, and `key`

2. When using an Azure DevOps Artifact feed, only the `token` property is required. The token notation should be `PAT:${{VARIABLE_NAME}}` otherwise the wrong authentication mechanism is used by Dependabot, see [here](https://github.com/tinglesoftware/dependabot-azure-devops/issues/50) for more details. 
When working with Azure DevOps Artifacts, some extra permission steps need to be done:

    1. The PAT should have *Packaging Read* permission.
    2. The user owning the PAT must be granted permissions to access the feed either directly or via a group. An easy way for this is to give `Contributor` permissions the `[{project_name}]\Contributors` group under the `Feed Settings -> Permissions` page. The page has the url format: `https://dev.azure.com/{organization}/{project}/_packaging?_a=settings&feed={feed-name}&view=permissions`.

3. When using a NuGet package server secured with basic auth, the `username`, `password`, and `token` properties are all required. The token notation should be `${{USERNAME}}:${{PASSWORD}}`, see [here](https://github.com/tinglesoftware/dependabot-azure-devops/issues/1232#issuecomment-2247616424) for more details.



## Security Advisories, Vulnerabilities, and Updates

Security-only updates ia a mechanism to only create pull requests for dependencies with vulnerabilities by updating them to the earliest available non-vulnerable version. Security updates are supported in the same way as the GitHub-hosted version. In addition, you can provide extra advisories, such as those for an internal dependency, in a JSON file via the `securityAdvisoriesFile` input e.g. `securityAdvisoriesFile: '$(Pipeline.Workspace)/advisories.json'`. A file example is available [here](./advisories-example.json).

A GitHub access token with `public_repo` access is required to perform the GitHub GraphQL for `securityVulnerabilities`.

## Development Guide

If you'd like to contribute to the project or just run it locally, view our development guides for:

- [Azure DevOps extension](./docs/extension.md#development-guide)
- [Dependabot updater](./docs/updater.md#development-guide)

## Acknowledgements

The work in this repository is based on inspired and occasionally guided by some predecessors in the same area:

1. Official Script support: [code](https://github.com/dependabot/dependabot-script)
2. Andrew Craven's work: [blog](https://medium.com/@acraven/updating-dependencies-in-azure-devops-repos-773cbbb6029d), [code](https://github.com/acraven/azure-dependabot)
3. Chris' work: [code](https://github.com/chris5287/dependabot-for-azuredevops)
4. andrcun's work on GitLab: [code](https://gitlab.com/dependabot-gitlab/dependabot)
5. WeWork's work for GitLab: [code](https://github.com/wemake-services/kira-dependencies)

## Issues &amp; Comments

Please leave all comments, bugs, requests, and issues on the Issues page. We'll respond to your request ASAP!
