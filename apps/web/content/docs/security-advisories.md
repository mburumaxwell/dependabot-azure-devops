---
title: Security Advisories and Vulnerabilities
description: Configure security-only updates and provide custom security advisories for dependencies.
---

Security-only updates allow you to create pull requests only for dependencies with known vulnerabilities, updating them to the earliest available non-vulnerable version. This is particularly useful when you want to focus on security fixes without receiving updates for every new package version.

## Enabling Security-Only Updates

To enable security-only updates, set `open-pull-requests-limit: 0` in your `dependabot.yml` configuration:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 0  # Only create PRs for security updates
```

This configuration mirrors the [GitHub-hosted Dependabot security updates behavior](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates#overriding-the-default-behavior-with-a-configuration-file).

## GitHub Access Token Required

Security-only updates require a GitHub access token to query the [GitHub Advisory Database](https://github.com/advisories) for vulnerability information.

### For Azure DevOps Extension

Provide a GitHub token using one of these task inputs:

```yaml
- task: dependabot@2
  inputs:
    gitHubAccessToken: '$(GITHUB_TOKEN)'
    # OR use a service connection
    gitHubConnection: 'github-connection-name'
```

The GitHub token must have `public_repo` scope (or full `repo` scope for private repositories).

### For CLI

Provide the GitHub token via command-line option:

```bash
paklo run \
  --provider azure
  --repository-url https://dev.azure.com/my-org/my-project/_git/my-repo \
  --git-token $GIT_ACCESS_TOKEN \
  --github-token $GITHUB_TOKEN
```

### Creating a GitHub Token

1. Go to GitHub Settings → Developer settings → [Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token (classic or fine-grained)
3. For classic tokens, select the `public_repo` scope
4. Copy the token and store it securely as a pipeline variable or environment variable

## Performance Considerations

Security-only updates incur a **slight performance overhead** compared to regular updates due to limitations in the Dependabot CLI ([dependabot/cli#360](https://github.com/dependabot/cli/issues/360)).

### How It Works

The process involves three steps:

1. **Discovery**: Run an "ignore everything" update job to discover all dependencies
2. **Vulnerability Check**: Check discovered dependencies against the GitHub Advisory Database
3. **Update**: Perform security-only updates for vulnerable dependencies

This extra discovery step adds processing time, but ensures accurate vulnerability detection.

## Custom Security Advisories

You can provide custom security advisories for internal or private dependencies that aren't in the public GitHub Advisory Database. This is useful for:

- Internal libraries with known vulnerabilities
- Private packages your organization maintains
- Security issues discovered through internal security scans

### Advisory File Format

Create a JSON file with your custom security advisories:

```json
[
  {
    "package": {
      "name": "Contoso.Utils"
    },
    "advisory": {
      "summary": "Contoso.Utils versions before 3.0.1 are vulnerable to input validation issues",
      "identifiers": [
        {
          "type": "CVE",
          "value": "CVE-2023-12345"
        }
      ]
    },
    "vulnerableVersionRange": "< 3.0.1",
    "firstPatchedVersion": {
      "identifier": "3.0.1"
    }
  }
]
```

:::info
A complete example is available in the repository: [advisories-example.json](https://github.com/mburumaxwell/paklo/blob/main/advisories-example.json)
:::

### Field Descriptions

- **`package.name`** (required): The package name as it appears in your dependency file
- **`advisory.summary`** (required): Description of the vulnerability
- **`advisory.identifiers`** (optional): CVE or other identifiers
- **`vulnerableVersionRange`** (required): Version range affected (use [semantic version ranges](https://devhints.io/semver))
- **`firstPatchedVersion.identifier`** (required): First version that fixes the vulnerability

### Using Custom Advisories with Extension

Specify the file path in your pipeline:

```yaml
- task: dependabot@2
  inputs:
    securityAdvisoriesFile: '$(Pipeline.Workspace)/advisories.json'
    gitHubAccessToken: '$(GITHUB_TOKEN)'
```

### Using Custom Advisories with CLI

Use the `--security-advisories-file` option:

```bash
paklo run \
  --provider azure
  --repository-url https://dev.azure.com/my-org/my-project/_git/my-repo \
  --git-token $GIT_ACCESS_TOKEN \
  --github-token $GITHUB_TOKEN \
  --security-advisories-file ./advisories.json
```

## Version Range Syntax

Use standard semantic versioning ranges in your advisories:

| Range | Meaning |
| ----- | ------- |
| `< 2.0.0` | Versions less than 2.0.0 |
| `<= 2.0.0` | Versions less than or equal to 2.0.0 |
| `> 1.0.0` | Versions greater than 1.0.0 |
| `>= 1.0.0` | Versions greater than or equal to 1.0.0 |
| `>= 1.0.0, < 2.0.0` | Versions 1.0.0 or higher, but less than 2.0.0 |
| `~> 2.1.0` | Versions 2.1.0 or higher, but less than 2.2.0 (pessimistic operator) |

You can combine multiple ranges with commas.

## Troubleshooting

### No Security Updates Created

If security-only mode is enabled but no PRs are created:

1. **Verify GitHub token** - Ensure it has `public_repo` scope
2. **Check for vulnerabilities** - Use GitHub's interface to check if known vulnerabilities exist for your dependencies
3. **Review logs** - Enable debug logging to see vulnerability check results
4. **Validate advisory file** - If using custom advisories, ensure the JSON is valid

### Error: "GitHub token required"

Security-only updates require a GitHub token. Make sure you've provided either:

- `gitHubAccessToken` input (extension)
- `--github-token` option (CLI)

### Advisory Not Triggering Updates

If your custom advisory isn't triggering updates:

1. Verify the `dependency-name` matches exactly (case-sensitive)
2. Check the version range syntax
3. Ensure current dependency version is in `affected-versions`
4. Verify the advisory file is being loaded (check logs)
