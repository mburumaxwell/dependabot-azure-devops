// https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel

const branch = process.env.VERCEL_GIT_COMMIT_REF;

// ignore builds for changeset release branches
if (branch.includes('changeset-release/')) {
  console.log('🛑 - Ignoring build for changeset branch:', branch);
  process.exit(0);
}

// ignore builds for dependabot branches, except for workflow and prisma
if (branch.includes('dependabot/') && !(branch.includes('workflow') || branch.includes('prisma'))) {
  console.log('🛑 - Ignoring build for dependabot branch:', branch);
  process.exit(0);
}

// proceed with the build
console.log('✅ - Build can proceed:', branch);
process.exit(1);
