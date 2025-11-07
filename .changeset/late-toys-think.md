---
"@paklo/core": minor
---

Migrate from deprecated GitHub `cvss` field to `cvssSeverities` with v4.0 support

Updated GitHub Security Advisory client to use the new `cvssSeverities` API that provides both CVSS v3.1 and v4.0 scores, replacing the deprecated cvss field. The implementation prioritizes CVSS v4.0 when available for enhanced vulnerability scoring accuracy and future compatibility.
