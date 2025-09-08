import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';

import { HttpRequestError, isErrorTemporaryFailure } from '@/core';
import { AzureDevOpsWebApiClient, sendRestApiRequestWithRetry } from './client';
import type { ICreatePullRequest } from './models';
import { VersionControlChangeType } from './types';
import { extractUrlParts } from './url-parts';

global.fetch = vi.fn();

describe('AzureDevOpsWebApiClient', () => {
  const url = extractUrlParts({
    organisationUrl: 'https://dev.azure.com/mock-organization',
    project: 'project',
    repository: 'repository',
  });
  const accessToken = 'mock-access-token';
  let client: AzureDevOpsWebApiClient;

  beforeEach(() => {
    client = new AzureDevOpsWebApiClient(url, accessToken);
    vi.clearAllMocks();
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
            changeType: VersionControlChangeType.Add,
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
      const mockRestApiPost = vi
        .spyOn(client as never, 'restApiPost')
        .mockResolvedValueOnce({
          commits: [{ commitId: 'new-commit-id' }],
        })
        .mockResolvedValueOnce({
          pullRequestId: 1,
        });
      vi.spyOn(client as never, 'restApiPatch').mockResolvedValueOnce({
        count: 1,
      });

      // Act
      pr.assignees = ['user1', 'user2'];
      const pullRequestId = await client.createPullRequest(pr);

      // Assert
      // biome-ignore-start lint/suspicious/noExplicitAny: tests
      expect(mockRestApiPost).toHaveBeenCalledTimes(2);
      expect((mockRestApiPost.mock.calls[1] as any)[1].reviewers.length).toBe(2);
      expect((mockRestApiPost.mock.calls[1] as any)[1].reviewers).toContainEqual({ id: 'user1' });
      expect((mockRestApiPost.mock.calls[1] as any)[1].reviewers).toContainEqual({ id: 'user2' });
      // biome-ignore-end lint/suspicious/noExplicitAny: tests
      expect(pullRequestId).toBe(1);
    });
  });
});

describe('sendRestApiRequestWithRetry', () => {
  let mockRequestAsync: MockedFunction<() => Promise<Response>>;
  let mockResponseBody: unknown;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequestAsync = vi.fn();
    mockResponseBody = {};
    mockResponse = {
      text: vi.fn(async () => JSON.stringify(mockResponseBody)),
      status: 200,
      statusText: 'OK',
    };
  });

  it('should send a request and return the response', async () => {
    mockRequestAsync.mockResolvedValue(mockResponse as Response);
    mockResponseBody = { hello: 'world' };

    const result = await sendRestApiRequestWithRetry('GET', 'https://example.com', undefined, mockRequestAsync);

    expect(mockRequestAsync).toHaveBeenCalledTimes(1);
    expect(mockResponse.text).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponseBody);
  });

  it('should throw an error if the response status code is not in the 2xx range', async () => {
    const badResponse = {
      text: vi.fn(async () => JSON.stringify(mockResponseBody)),
      status: 400,
      statusText: 'Bad Request',
    } as Partial<Response>;
    mockRequestAsync.mockResolvedValue(badResponse as Response);

    await expect(
      sendRestApiRequestWithRetry('GET', 'https://example.com', undefined, mockRequestAsync),
    ).rejects.toThrow(/400 Bad Request/i);
  });

  it('should throw an error if the response cannot be parsed as JSON', async () => {
    mockRequestAsync.mockResolvedValue(mockResponse as Response);
    mockResponse.text = vi.fn(async () => 'invalid json');

    await expect(
      sendRestApiRequestWithRetry('GET', 'https://example.com', undefined, mockRequestAsync),
    ).rejects.toThrow('Unexpected token \'i\', "invalid json" is not valid JSON');
  });

  it('should throw an error after retrying a request three times', async () => {
    const err = Object.assign(new Error('connect ETIMEDOUT 127.0.0.1:443'), { code: 'ETIMEDOUT' });
    mockRequestAsync.mockRejectedValue(err);

    await expect(
      sendRestApiRequestWithRetry('GET', 'https://example.com', undefined, mockRequestAsync, true, 3, 0),
    ).rejects.toThrow(err);
    expect(mockRequestAsync).toHaveBeenCalledTimes(3);
  });

  it('should retry the request if a temporary failure error is thrown', async () => {
    const err = Object.assign(new Error('connect ETIMEDOUT 127.0.0.1:443'), { code: 'ETIMEDOUT' });
    mockRequestAsync.mockRejectedValueOnce(err);
    mockRequestAsync.mockResolvedValueOnce(mockResponse as Response);
    mockResponseBody = { hello: 'world' };

    const result = await sendRestApiRequestWithRetry(
      'GET',
      'https://example.com',
      undefined,
      mockRequestAsync,
      true,
      3,
      0,
    );

    expect(mockRequestAsync).toHaveBeenCalledTimes(2);
    expect(mockResponse.text).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponseBody);
  });
});

describe('isErrorTemporaryFailure', () => {
  it('should return true for HttpRequestError with status code 502', () => {
    const error = new HttpRequestError('Bad Gateway', 502);
    expect(isErrorTemporaryFailure(error)).toBe(true);
  });

  it('should return true for HttpRequestError with status code 503', () => {
    const error = new HttpRequestError('Service Unavailable', 503);
    expect(isErrorTemporaryFailure(error)).toBe(true);
  });

  it('should return true for HttpRequestError with status code 504', () => {
    const error = new HttpRequestError('Gateway Timeout', 504);
    expect(isErrorTemporaryFailure(error)).toBe(true);
  });

  it('should return false for HttpRequestError with other status codes', () => {
    const error = new HttpRequestError('Bad Request', 400);
    expect(isErrorTemporaryFailure(error)).toBe(false);
  });

  it('should return true for Node.js system error with code ETIMEDOUT', () => {
    const error = { code: 'ETIMEDOUT', message: 'Operation timed out' };
    expect(isErrorTemporaryFailure(error)).toBe(true);
  });

  it('should return false for Node.js system error with other codes', () => {
    const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
    expect(isErrorTemporaryFailure(error)).toBe(false);
  });

  it('should return false for undefined or null errors', () => {
    expect(isErrorTemporaryFailure(undefined)).toBe(false);
    expect(isErrorTemporaryFailure(null)).toBe(false);
  });
});
