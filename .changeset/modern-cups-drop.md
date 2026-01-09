---
"@paklo/runner": minor
---

Remove `fetch_files` command.
In <https://github.com/dependabot/dependabot-core/pull/13275> the `fetch_files` command was made a no-op, and it does not need to be called.
Also cleaned up environment variables that are not used as a result.
Copied from: <https://github.com/github/dependabot-action/pull/1550>
