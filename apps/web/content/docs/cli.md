---
title: CLI
description: Run Dependabot updates locally from your machine, CI/CD pipelines, or any environment with Docker.
---

The Paklo CLI is a powerful command-line tool for running Dependabot updates against your repositories. Unlike the extension or hosted version, the CLI gives you complete control over when and where updates run.

## Installation

**Requirements:**

- Node.js 22 or later
- Docker (Docker Desktop on macOS/Windows, Docker Engine on Linux)

### Global Installation

```bash
npm install -g @paklo/cli
paklo --version
```

### Using npx (No Installation)

```bash
npx @paklo/cli --help
```

### Verify Installation

```bash
# Check CLI is installed
paklo --version

# Check Docker is running
docker ps
```

## Quick Start

### 1. Validate Configuration (optional)

First, validate your `dependabot.yml` file:

```bash
paklo validate \
  --organization-url https://dev.azure.com/my-org \
  --project my-project \
  --repository my-repo \
  --git-token $AZDO_TOKEN
```

### 2. Run Updates

Execute dependency updates:

```bash
paklo run \
  --organization-url https://dev.azure.com/my-org \
  --project my-project \
  --repository my-repo \
  --git-token $AZDO_TOKEN \
  --github-token $GITHUB_TOKEN
```

### 3. Clean Up (optional)

Remove old Docker resources:

```bash
paklo cleanup
```

## Commands

### validate

Validates your `dependabot.yml` configuration file against a repository.

```bash
paklo validate [options]
```

**Required Options:**

- `--organization-url <URL>` - Azure DevOps organization URL (e.g., `https://dev.azure.com/my-org`)
- `--project <PROJECT>` - Project name or ID
- `--repository <REPOSITORY>` - Repository name or ID
- `--git-token <TOKEN>` - Azure DevOps Personal Access Token

**Example:**

```bash
paklo validate \
  --organization-url https://dev.azure.com/contoso \
  --project contoso-project \
  --repository web-app \
  --git-token $AZDO_PAT
```

### run

Executes Dependabot updates for the specified repository.

```bash
paklo run [options]
```

**Required Options:**

- `--organization-url <URL>` - Azure DevOps organization URL
- `--project <PROJECT>` - Project name or ID
- `--repository <REPOSITORY>` - Repository name or ID
- `--git-token <TOKEN>` - Azure DevOps Personal Access Token

**Optional Options:**

| Option | Description | Default |
| ------ | ----------- | ------- |
| `--github-token <TOKEN>` | GitHub token to avoid rate limiting | - |
| `--out-dir <DIR>` | Working directory for updates | `work` |
| `--auto-approve` | Automatically approve pull requests | `false` |
| `--auto-approve-token <TOKEN>` | Token for auto-approve (if different from git-token) | - |
| `--set-auto-complete` | Auto-complete PRs when policies are met | `false` |
| `--merge-strategy <STRATEGY>` | Merge strategy: `squash`, `rebase`, `merge` | `squash` |
| `--auto-complete-ignore-config-ids <IDS>` | Config IDs to ignore for auto-complete | - |
| `--author-name <NAME>` | Git author name | `dependabot[bot]` |
| `--author-email <EMAIL>` | Git author email | `noreply@github.com` |
| `--target-update-ids <IDS>` | Specific update IDs to run (comma-separated) | All |
| `--security-advisories-file <FILE>` | Path to custom security advisories JSON file | - |
| `--experiments <EXPERIMENTS>` | Comma-separated experiments to enable | - |
| `--updater-image <IMAGE>` | Custom Dependabot updater Docker image | - |
| `--command <COMMAND>` | Dependabot command: `update`, `security-update` | - |
| `--inspect` | Write API requests to `./inspections` for troubleshooting | `false` |
| `--port <PORT>` | Port for internal API server | Random |
| `--debug` | Enable debug logging | `false` |
| `--dry-run` | Run without making changes | `false` |

**Example:**

```bash
paklo run \
  --organization-url https://dev.azure.com/contoso \
  --project contoso-project \
  --repository web-app \
  --git-token $AZDO_PAT \
  --github-token $GITHUB_TOKEN \
  --auto-approve \
  --set-auto-complete \
  --merge-strategy squash \
  --experiments "record_ecosystem_versions,separate_major_minor_updates" \
  --debug
```

### fetch-images

Pre-fetch Docker images used by Dependabot. Useful for testing image existence or package manager mapping.

```bash
paklo fetch-images <packageManager>
```

**Required Arguments:**

- `<packageManager>` - The package manager to fetch the updater image for (e.g., `npm_and_yarn`, `bundler`, `pip`, `cargo`, etc.)

**Example:**

```bash
# Fetch images for npm_and_yarn
paklo fetch-images npm_and_yarn

# Fetch images for bundler
paklo fetch-images bundler
```

This downloads the updater Docker image for the specified package manager and the proxy image.

### cleanup

Removes old Docker images and containers created by Dependabot.

```bash
paklo cleanup [options]
```

**Options:**

- `--cutoff <DURATION>` - Remove resources older than duration (e.g., `24h`, `7d`) | Default: `24h`

**Examples:**

```bash
# Remove resources older than 24 hours (default)
paklo cleanup

# Remove resources older than 7 days
paklo cleanup --cutoff 7d

# Remove all Dependabot resources
paklo cleanup --cutoff 0s
```

## Configuration

The CLI uses standard configuration files. See [Configuration](/docs/configuration) for complete options.

### Variable Substitution

Use `$VARIABLE` or `${VARIABLE}` syntax for environment variables:

```yaml
registries:
  private-npm:
    type: npm-registry
    url: https://npm.example.com
    token: $NPM_TOKEN
```

These will be pulled from environment variables. You'll be prompted for missing variables.

## Logging

Set verbosity level:

```bash
paklo -v trace run ...  # Most detailed
paklo -v debug run ...  # Debug information
paklo -v info run ...   # Standard (default)
paklo -v warn run ...   # Warnings only
paklo -v error run ...  # Errors only
```

## Advanced Usage

### Target Specific Updates

Run only certain update configurations:

```bash
# Run only the update configurations at index 1 and 3
paklo run ... --target-update-ids 1,3
```

### Custom Experiments

Enable experimental features:

```bash
paklo run ... --experiments "tidy=true,vendor=true,goprivate=*"
```

See [Experiments](/docs/experiments) for usage patterns.

### Inspect Mode

Debug Dependabot API interactions:

```bash
paklo run ... --inspect
```

Creates `./inspections/` directory with JSON files of API requests and responses.

### Dry Run

Test without making changes:

```bash
paklo run ... --dry-run
```

Performs update checks but doesn't create pull requests.

### Proxy Configuration

Configure HTTP/HTTPS proxies:

```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1,.company.com
```

## Troubleshooting

### Common Issues

**Docker not running:**

```bash
Error: Cannot connect to the Docker daemon
```

**Solution:** Start Docker Desktop or Docker daemon.

**Network connectivity:**

```bash
Error: getaddrinfo ENOTFOUND
```

**Solution:** Check network/proxy configuration. May need to configure proxy environment variables.

### Debug Mode

Enable detailed logging:

```bash
paklo -v trace run ... --debug
```

This provides:

- Docker container logs
- API request/response details
- Detailed error stack traces

### Inspect Failed Updates

Use inspect mode to capture API interactions:

```bash
paklo run ... --inspect
```

Check `./inspections/` for JSON files with request/response data.

### Clean Docker State

If updates fail due to Docker issues:

```bash
# Remove all Dependabot resources
paklo cleanup --cutoff 0s
```
