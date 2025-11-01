'use server';

export async function validateGitHubToken({ token }: { token: string }): Promise<{ valid: boolean; message?: string }> {
  // TODO: implement GitHub token validation logic here
  new Promise((resolve) => setTimeout(resolve, 2000));
  return { valid: true };
}
