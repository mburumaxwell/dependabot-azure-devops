---
title: Using Private Registries
description: Configure Dependabot to access private feeds and registries.
---

Dependabot can authenticate to private package sources by defining them in the `registries` section of `dependabot.yml`.

```yml
version: 2
registries:
  my-analyzers:
    type: nuget-feed
    url: https://dev.azure.com/organization2/_packaging/my-analyzers/nuget/v3/index.json
  telerik:
    type: nuget-feed
    url: https://nuget.telerik.com/v3/index.json
    username: ${{ MY_TELERIK_USERNAME }}
    password: ${{ MY_TELERIK_PASSWORD }}
    token: ${{ MY_TELERIK_USERNAME }}:${{ MY_TELERIK_PASSWORD }}

updates:
  # ...
```

Secrets use the `${{ VARIABLE_NAME }}` notation and are resolved from pipeline environment variables. Fields considered secret include `username`, `password`, `token`, and `key`.

When using an Azure DevOps Artifact feed, the token must be provided as `PAT:${{ VARIABLE_NAME }}` where the variable contains a personal access token with **Packaging (Read)** permission and access to the feed.
