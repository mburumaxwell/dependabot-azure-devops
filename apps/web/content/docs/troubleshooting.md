---
title: Troubleshooting
description: Fix common problems when running Dependabot with the extension, CLI, or hosted service.
---

## Deployment-Specific Issues

### Extension: Missing Docker

Dependabot runs inside Docker with Linux containers. Ensure your agents have Docker available. The Microsoft-hosted `ubuntu-latest` image already includes it.

### CLI: Missing Docker

Ensure Docker is installed and running:

```bash
docker ps
```

On macOS/Windows, start Docker Desktop. On Linux, ensure the Docker daemon is running.

### Hosted: No Docker Required

The hosted service manages all infrastructure. No Docker installation needed.

## Existing Pull Requests

Dependabot may skip updates when there are open pull requests created manually or by earlier versions of the task. Complete or abandon those pull requests before running the task.

## Authentication to Private Feeds

For private registries, supply credentials via environment variables and the `registries` section in `dependabot.yml`. When using Azure DevOps Artifact feeds, the personal access token must have **Packaging (Read)** permission and access to the feed.

## Debugging Updates

Set the `dryRun` input to `true` to test without creating pull requests. Review pipeline logs for details on failures or missing permissions.
