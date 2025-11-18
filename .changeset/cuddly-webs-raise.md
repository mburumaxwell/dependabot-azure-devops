---
"@paklo/core": patch
---

Prevent ReDoS vulnerabilities in regex patterns

- Replace unsafe regex quantifiers in branch name normalization with safe string operations using split/filter/join
- Replace regex-based placeholder extraction with bounded quantifiers and non-global matching to prevent exponential backtracking
- Eliminates potential denial of service attacks from maliciously crafted input strings with consecutive special characters
