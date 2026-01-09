# Paklo

Automated dependency updates for Azure DevOps repositories using [Dependabot](https://dependabot.com).

## Options

- **[Hosted Service](https://www.paklo.app)** - Managed service (Paklo)
- **[Azure DevOps Extension](https://marketplace.visualstudio.com/items?itemName=tingle-software.dependabot)** - Run in Azure Pipelines
- **[CLI Tool](./packages/cli/)** - Run locally or in any CI/CD environment

## Quick Start

Install the [extension](https://marketplace.visualstudio.com/items?itemName=tingle-software.dependabot) or [CLI](./packages/cli/), then create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

## Documentation

**📚 [www.paklo.app/docs](https://www.paklo.app/docs)**

## Contributing

See [CONTRIBUTING.MD](./CONTRIBUTING.MD)

## License

[MIT License](LICENSE)
