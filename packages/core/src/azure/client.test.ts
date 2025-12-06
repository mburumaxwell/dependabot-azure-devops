// biome-ignore-all lint/suspicious/noExplicitAny: tests

import ky from 'ky';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AzureDevOpsWebApiClient } from './client';
import type { ICreatePullRequest } from './models';
import { extractRepositoryUrl } from './url-parts';

vi.mock('ky');

describe('AzureDevOpsWebApiClient', () => {
  const url = extractRepositoryUrl({
    organisationUrl: 'https://dev.azure.com/mock-organization',
    project: 'project',
    repository: 'repository',
  });
  const accessToken = 'mock-access-token';
  let client: AzureDevOpsWebApiClient;
  let mockKyInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock ky instance
    mockKyInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    };

    // Mock ky.create to return our mock instance
    vi.mocked(ky.create).mockReturnValue(mockKyInstance as any);

    client = new AzureDevOpsWebApiClient(url, accessToken);
  });

  describe('createPullRequest', () => {
    let pr: ICreatePullRequest;

    beforeEach(() => {
      pr = {
        project: 'project',
        repository: 'repository',
        source: {
          branch: 'update-branch',
          commit: 'commit-id',
        },
        target: {
          branch: 'main',
        },
        title: 'PR Title',
        description: 'PR Description',
        commitMessage: 'Commit Message',
        changes: [
          {
            path: 'file.txt',
            content: 'hello world',
            encoding: 'utf-8',
            changeType: 'add',
          },
        ],
      };
    });

    it('should create a pull request without duplicate reviewer and assignee identities', async () => {
      // Arrange
      vi.spyOn(client, 'getUserId').mockResolvedValue('my-user-id');
      vi.spyOn(client, 'resolveIdentityId').mockImplementation(async (identity?: string) => {
        return identity || '';
      });

      // Mock the push (first POST call)
      mockKyInstance.post.mockReturnValueOnce({
        json: vi.fn().mockResolvedValue({ commits: [{ commitId: 'new-commit-id' }] }),
      });

      // Mock the create PR (second POST call)
      let capturedReviewers: any;
      mockKyInstance.post.mockReturnValueOnce({
        json: vi.fn().mockImplementation(async () => {
          // Capture the reviewers from the call
          const calls = mockKyInstance.post.mock.calls;
          const createPrCall = calls.find((call: any[]) => call[0]?.includes('/pullrequests'));
          if (createPrCall?.[1]?.json?.reviewers) {
            capturedReviewers = createPrCall[1].json.reviewers;
          }
          return { pullRequestId: 1 };
        }),
      });

      // Mock the properties patch
      mockKyInstance.patch.mockReturnValueOnce({
        json: vi.fn().mockResolvedValue({ count: 1 }),
      });

      // Act
      pr.assignees = ['user1', 'user2'];
      const pullRequestId = await client.createPullRequest(pr);

      // Assert
      expect(mockKyInstance.post).toHaveBeenCalledTimes(2);
      expect(capturedReviewers).toBeDefined();
      expect(capturedReviewers.length).toBe(2);
      expect(capturedReviewers).toContainEqual({ id: 'user1' });
      expect(capturedReviewers).toContainEqual({ id: 'user2' });
      expect(pullRequestId).toBe(1);
    });
  });
});
