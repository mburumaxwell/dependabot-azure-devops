---
"@paklo/runner": minor
"@paklo/core": minor
"extension-azure-devops": patch
"@paklo/cli": patch
---

Change job ID type from number to string.
This is so as to support all possibilities (bigint/snowflake, ksuid, autoincrement, etc)
