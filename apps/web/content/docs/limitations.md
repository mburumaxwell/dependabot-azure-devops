---
title: Limitations and Unsupported Features
description: Known limitations and unsupported configuration options for Dependabot on Azure DevOps.
---

While Paklo aims to support all [official Dependabot configuration options](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference), there are some limitations specific to Azure DevOps and the different deployment methods.

## Feature Parity Status

| Feature | Extension (v2) | Hosted | CLI |
| ------- | -------------- | ------ | --- |
| Basic updates | ✅ | ✅ | ✅ |
| Security-only updates | ✅ | ✅ | ✅ |
| Private registries | ✅ | ✅ | ✅ |
| Custom CA certificates | ✅ | ❌ | ✅ |
| Experiments | ✅ | ⚠️ Partial | ✅ |
| Groups | ✅ | ✅ | ✅ |
| Assignees | ✅ | ✅ | ✅ |
| Labels | ✅ | ✅ | ✅ |
| Milestones | ✅ | ✅ | ✅ |
| Custom commit messages | ✅ | ✅ | ✅ |
| Ignore rules | ✅ | ✅ | ✅ |
| Allow rules | ✅ | ✅ | ✅ |
| Target branch | ✅ | ✅ | ✅ |
| Rebase strategy | ✅ | ✅ | ✅ |
| Vendor (Go) | ✅ | ✅ | ✅ |
| Version strategy | ✅ | ✅ | ✅ |

**Legend**:

- ✅ Fully supported
- ⚠️ Partially supported or with limitations
- ❌ Not supported

## Reporting Issues

If you encounter limitations not documented here:

1. Check if it's a known issue in [GitHub Issues](https://github.com/mburumaxwell/paklo/issues)
2. Search [Discussions](https://github.com/mburumaxwell/paklo/discussions) for workarounds
3. Create a new issue with:
   - Your deployment method (extension, hosted, or CLI)
   - The feature or configuration that doesn't work
   - Your `dependabot.yml` configuration (sanitized)
   - Any error messages or logs
