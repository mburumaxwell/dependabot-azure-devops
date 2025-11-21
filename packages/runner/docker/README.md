## Dependabot Containers

This Action uses two Dependabot containers from the GitHub Container Registry to perform jobs.

In order to ensure that any given release of the Action deterministically uses the same, tested containers we
use these Dockerfiles to check-in the specific SHA for each.

This allows us to use Dependabot to keep these SHAs up to date as new versions of the container are published.

These Dockerfiles are not actually built by the Action or any CI processes, they are purely used as compile-time
configuration to generate `containers.json` which is used at runtime.
