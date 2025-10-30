---
title: Troubleshooting
description: Fix common problems when running Dependabot in Azure Pipelines.
---

## Missing Docker

Dependabot runs inside Docker with Linux containers. Ensure your agents have Docker available. The Microsoft-hosted `ubuntu-latest` image already includes it.

## Existing Pull Requests

Dependabot may skip updates when there are open pull requests created manually or by earlier versions of the task. Complete or abandon those pull requests before running the task.

## Authentication to Private Feeds

For private registries, supply credentials via environment variables and the `registries` section in `dependabot.yml`. When using Azure DevOps Artifact feeds, the personal access token must have **Packaging (Read)** permission and access to the feed.

## Debugging Updates

Set the `dryRun` input to `true` to test without creating pull requests. Review pipeline logs for details on failures or missing permissions.
