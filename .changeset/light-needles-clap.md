---
"@paklo/runner": minor
"@paklo/core": minor
"extension-azure-devops": minor
"@paklo/cli": minor
---

Require schedule to be present in the updates configuration.
Anyone using `.github/dependabot.{yaml,yml}` already has schema warnings in the IDE.
This change is another step to bringing parity to the GitHub-hosted version and is necessary for our hosted version.
