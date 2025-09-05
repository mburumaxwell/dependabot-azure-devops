# Paklo CLI

A powerful CLI tool for running Dependabot updates against Azure DevOps repositories from anywhere - your local machine, CI/CD pipelines, or any environment with Docker support.

## Why Paklo?

Unlike GitHub's hosted Dependabot service, Azure DevOps repositories need a different approach for dependency updates. Paklo bridges this gap by providing:

- **Local Development** - Test dependency updates on your machine before deploying
- **CI/CD Integration** - Run updates in your existing pipelines with full control
- **Anywhere Execution** - No dependency on specific hosting environments
- **Full Compatibility** - Aims to be at feature parity with GitHub's hosted Dependabot
- **Azure DevOps Native** - Built specifically for Azure DevOps repositories and workflows

## Installation

**Requirements:** Node.js 22 or later and docker

```bash
# Install globally
npm install -g @paklo/cli

# Or use with npx
npx @paklo/cli --help
```

## Quick Start

```bash
# Validate your dependabot.yml configuration
paklo validate https://dev.azure.com/my-org my-project my-repo --git-token <TOKEN>

# Run dependency updates locally
paklo run https://dev.azure.com/my-org my-project my-repo --git-token <TOKEN>

# Clean up Docker resources
paklo cleanup
```

## Commands

### `validate`

Validates your Dependabot configuration file against a repository.

```bash
paklo validate <organisation-url> <project> <repository> --git-token <TOKEN>
```

**Arguments:**

- `organisation-url` - Azure DevOps organization URL (e.g., `https://dev.azure.com/my-org`)
- `project` - Project name or ID
- `repository` - Repository name or ID

**Options:**

- `--git-token <TOKEN>` - Git access token (required)

### `run`

Executes Dependabot updates locally with full control over the process.

```bash
paklo run <organisation-url> <project> <repository> [options]
```

**Key Options:**

- `--git-token <TOKEN>` - Git access token (required)
- `--github-token <TOKEN>` - GitHub token to avoid rate limiting
- `--out-dir <DIR>` - Working directory (default: `work`)
- `--auto-approve` - Automatically approve pull requests
- `--set-auto-complete` - Auto-complete PRs when policies are met
- `--merge-strategy <STRATEGY>` - Merge strategy: `squash`, `rebase`, or `merge`
- `--author-name <NAME>` - Git author name
- `--author-email <EMAIL>` - Git author email
- `--experiments <LIST>` - Comma-separated experiments to enable
- `--updater-image <IMAGE>` - Custom updater Docker image
- `--dry-run` - Run without making changes
- `--debug` - Enable debug logging

**Example:**

```bash
paklo run https://dev.azure.com/contoso contoso-project web-app \
  --git-token $GIT_TOKEN \
  --github-token $GITHUB_TOKEN \
  --auto-approve \
  --set-auto-complete \
  --merge-strategy squash \
  --experiments "record_ecosystem_versions,separate_major_minor_updates"
```

### `cleanup`

Removes old Docker images and containers used by Dependabot.

```bash
paklo cleanup
```

## Configuration

Paklo works with standard `dependabot.yml` files. Place your configuration at `.github/dependabot.yml` in your repository.

**Example configuration:**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "my-team"
    assignees:
      - "dependabot-assignee"
```

When your `dependabot.yml` contains variable placeholders (like `$NPM_TOKEN`), Paklo will prompt you to provide values during execution or read them from environment variables.

### Private Registries

Configure private registries in your `dependabot.yml`:

```yaml
version: 2
registries:
  private-npm:
    type: npm-registry
    url: https://npm.example.com
    token: $NPM_TOKEN
updates:
  - package-ecosystem: "npm"
    directory: "/"
    registries:
      - private-npm
    schedule:
      interval: "weekly"
```

## Advanced Usage

### Custom Experiments

Enable Dependabot experiments to test new features:

```bash
paklo run ... --experiments "record_ecosystem_versions,separate_major_minor_updates"
```

### Custom Updater Images

Use a specific Dependabot updater image:

```bash
paklo run ... --updater-image "ghcr.io/dependabot/dependabot-updater-{ecosystem}:latest"
```

### Targeting Specific Updates

Run only specific update configurations:

```bash
paklo run ... --target-update-ids 1,3,5
```

### Security Advisories

Provide a custom security advisories file:

```bash
paklo run ... --security-advisories-file ./advisories.json
```

## Ecosystem Support

Paklo aims to maintain feature parity with GitHub's hosted Dependabot service, supporting all available package ecosystems including npm, NuGet, Maven, Bundler, pip, Composer, Go modules, Cargo, Docker, GitHub Actions, Terraform, and more.

## Troubleshooting

### Common Issues

**Rate limiting:** Use `--github-token` to avoid GitHub API rate limits.

**Docker issues:** Run `paklo cleanup` to remove old containers and images.

**Authentication:** Ensure your git token has appropriate permissions for the repository.

**Network issues:** Check that your environment can access both Azure DevOps and external package registries.

### Debug Mode

Enable detailed logging:

```bash
paklo run ... --debug
```

## Integration

### CI/CD Pipelines

Paklo can be integrated into CI/CD pipelines for testing dependency updates:

```yaml
# Azure Pipelines example
- script: |
    npm install -g @paklo/cli
    paklo validate $(System.TeamFoundationCollectionUri) $(System.TeamProject) $(Build.Repository.Name) --git-token $(System.AccessToken)
  displayName: 'Validate Dependabot Config'
```

### Docker

Run Paklo in a containerized environment:

```dockerfile
FROM node:22-alpine
RUN npm install -g @paklo/cli
WORKDIR /app
CMD ["paklo", "--help"]
```

## Contributing, License & Support

For contributing guidelines, license information, bug reports, and support:

👉 **Visit the main project repository:** [dependabot-azure-devops](https://github.com/mburumaxwell/dependabot-azure-devops)
