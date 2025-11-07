import { Octokit } from 'octokit';

export function createGitHubClient({ token }: { token: string }): Octokit {
  return new Octokit({
    auth: token,
    // could add retry here perhaps?
  });
}
