#!/bin/bash

# Exit with code 0 to cancel the build if this is a dependabot branch
if [[ "$VERCEL_GIT_COMMIT_REF" =~ ^dependabot/.* ]]; then
  echo "🤖 This is a Dependabot PR. Skipping deployment."
  exit 0;
fi

# Exit with code 1 to proceed with the build for all other branches
echo "✅ Proceeding with deployment."
exit 1;
