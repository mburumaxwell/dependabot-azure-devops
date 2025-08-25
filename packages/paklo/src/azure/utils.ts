export function normalizeFilePath(path: string): string {
  // Convert backslashes to forward slashes, convert './' => '/' and ensure the path starts with a forward slash if it doesn't already, this is how DevOps paths are formatted
  return path
    ?.replace(/\\/g, '/')
    ?.replace(/^\.\//, '/')
    ?.replace(/^([^/])/, '/$1');
}

export function normalizeBranchName(branch?: string): string | undefined {
  // Strip the 'refs/heads/' prefix from the branch name, if present
  return branch?.replace(/^refs\/heads\//i, '');
}
