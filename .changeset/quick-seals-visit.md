---
"@paklo/core": patch
---

Handle organization URLs without trailing slashes.
For example `https://dev.azure.com/contoso/` and `https://dev.azure.com/contoso` now result in the same organization.
