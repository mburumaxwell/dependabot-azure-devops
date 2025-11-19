---
"@paklo/core": patch
---

Improve Azure DevOps file change handling for Dependabot updates
- Skip no-op changes and avoid sending bodies for delete operations when pushing PR commits
- Treat missing content and encoding as optional through the request models and builders
- Tighten Dependabot dependency file schema with explicit operation and encoding enums
