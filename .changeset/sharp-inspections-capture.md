---
"@paklo/cli": minor
"@paklo/core": minor
---

Add request inspection support for troubleshooting.
- CLI `run` command can write raw Dependabot requests with `--inspect`, writing JSON snapshots under `./inspections`.
- Core server accepts an optional inspect hook that records the raw request payload before processing.
