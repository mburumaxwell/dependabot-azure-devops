// biome-ignore-all lint/suspicious/noExplicitAny: test file
// biome-ignore-all lint/complexity/useLiteralKeys: test file

import type { AzureDevOpsWebApiClient } from '@paklo/core/azure';
import {
  DEVOPS_PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
  DEVOPS_PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
  extractRepositoryUrl,
  type IPullRequestProperties,
} from '@paklo/core/azure';
import type { DependabotJobBuilderOutput, DependabotUpdate } from '@paklo/core/dependabot';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AzureLocalDependabotServer, type AzureLocalDependabotServerOptions } from './server';

vi.mock('./client');
vi.mock('./logger');

describe('AzureLocalDependabotServer', () => {
  let server: AzureLocalDependabotServer;
  let options: AzureLocalDependabotServerOptions;
  let authorClient: AzureDevOpsWebApiClient;
  let approverClient: AzureDevOpsWebApiClient;
  let existingBranchNames: string[];
  let existingPullRequests: IPullRequestProperties[];

  beforeEach(() => {
    authorClient = {
      createPullRequest: vi.fn(),
      updatePullRequest: vi.fn(),
      abandonPullRequest: vi.fn(),
      addCommentThread: vi.fn(),
      approvePullRequest: vi.fn(),
      getDefaultBranch: vi.fn(),
    } as unknown as AzureDevOpsWebApiClient;

    approverClient = {
      approvePullRequest: vi.fn(),
    } as unknown as AzureDevOpsWebApiClient;

    existingBranchNames = [];
    existingPullRequests = [];

    options = {
      url: extractRepositoryUrl({
        organisationUrl: 'http://localhost:8081/contoso/',
        project: 'testproject',
        repository: 'test-repo',
      }),
      authorClient,
      autoApprove: false,
      approverClient,
      setAutoComplete: false,
      autoCompleteIgnoreConfigIds: [],
      existingBranchNames,
      existingPullRequests,
      author: { email: 'test@example.com', name: 'Test User' },
      debug: false,
      dryRun: false,
    };

    server = new AzureLocalDependabotServer(options);
  });

  describe('handle', () => {
    let jobBuilderOutput: DependabotJobBuilderOutput;
    let update: DependabotUpdate;

    beforeEach(() => {
      vi.clearAllMocks();
      jobBuilderOutput = {
        job: {
          id: '1',
          'package-manager': 'npm_and_yarn',
          source: {
            hostname: 'localhost:8081',
            provider: 'azure',
            repo: 'testproject/_git/test-repo',
          },
          experiments: {},
          'credentials-metadata': [],
          'allowed-updates': [],
          'existing-group-pull-requests': [],
          'existing-pull-requests': [],
          'lockfile-only': false,
          'requirements-update-strategy': null,
          'update-subdependencies': false,
          debug: false,
          dependencies: [],
          'security-advisories': [],
          'security-updates-only': false,
          'updating-a-pull-request': false,
          'ignore-conditions': [],
          'commit-message-options': {
            prefix: null,
            'prefix-development': null,
            'include-scope': null,
          },
          'repo-private': true,
          'vendor-dependencies': false,
        },
        credentials: [],
      };
      update = {
        'package-ecosystem': 'npm',
      };

      // Mock the job and update methods
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });
    });

    it('should process "update_dependency_list"', async () => {
      const result = await (server as any).handle('1', {
        type: 'update_dependency_list',
        data: {
          dependencies: [],
          dependency_files: [],
        },
      });

      expect(result).toEqual(true);
    });

    it('should process "create_dependency_submission"', async () => {
      const result = await (server as any).handle('1', {
        type: 'create_dependency_submission',
        data: {
          version: 1,
          sha: '41fa8b4fe8d90fe7db38d4b730768e7dc52bc983',
          ref: 'refs/heads/main',
          job: {
            correlator: 'dependabot-terraform-**-terraform',
            id: '3302222848',
          },
          detector: {
            name: 'dependabot',
            version: '0.349.0-25e6e4a90121d8f8dae0c687f99ccd0aa15a7db6dd1ba623bbee7d766936e0aa',
            url: 'https://github.com/dependabot/dependabot-core',
          },
          manifests: {},
        },
      });

      expect(result).toEqual(true);
    });

    it('should skip processing "create_pull_request" if "dryRun" is true', async () => {
      options.dryRun = true;
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      const result = await (server as any).handle('1', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          dependencies: [],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.createPullRequest).not.toHaveBeenCalled();
    });

    it('should skip processing "create_pull_request" if open pull request limit is reached', async () => {
      const packageManager = 'nuget';
      update['open-pull-requests-limit'] = 1;
      jobBuilderOutput.job['package-manager'] = packageManager;
      existingPullRequests.push({
        id: 1,
        properties: [
          { name: DEVOPS_PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: packageManager },
          { name: DEVOPS_PR_PROPERTY_DEPENDABOT_DEPENDENCIES, value: '[]' },
        ],
      } as IPullRequestProperties);

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      const result = await (server as any).handle('1', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          dependencies: [],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.createPullRequest).not.toHaveBeenCalled();
    });

    it('should process "create_pull_request"', async () => {
      options.autoApprove = true;
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.createPullRequest).mockResolvedValue(11);
      vi.mocked(authorClient.getDefaultBranch).mockResolvedValue('main');
      vi.mocked(approverClient!.approvePullRequest).mockResolvedValue(true);

      const result = await (server as any).handle('1', {
        type: 'create_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          dependencies: [],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.createPullRequest).toHaveBeenCalled();
      expect(approverClient!.approvePullRequest).toHaveBeenCalled();
    });

    it('should skip processing "update_pull_request" if "dryRun" is true', async () => {
      options.dryRun = true;
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      const result = await (server as any).handle('1', {
        type: 'update_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependency-names': [],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.updatePullRequest).not.toHaveBeenCalled();
    });

    it('should fail processing "update_pull_request" if pull request does not exist', async () => {
      const result = await (server as any).handle('1', {
        type: 'update_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependency-names': ['dependency1'],
        },
      });

      expect(result).toEqual(false);
      expect(authorClient.updatePullRequest).not.toHaveBeenCalled();
    });

    it('should process "update_pull_request"', async () => {
      options.autoApprove = true;
      jobBuilderOutput.job['package-manager'] = 'npm_and_yarn';

      existingPullRequests.push({
        id: 11,
        properties: [
          { name: DEVOPS_PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: DEVOPS_PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify([{ 'dependency-name': 'dependency1' }]),
          },
        ],
      });

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.updatePullRequest).mockResolvedValue(true);
      vi.mocked(approverClient!.approvePullRequest).mockResolvedValue(true);

      const result = await (server as any).handle('1', {
        type: 'update_pull_request',
        data: {
          'base-commit-sha': '1234abcd',
          'commit-message': 'Test commit message',
          'pr-body': 'Test body',
          'pr-title': 'Test PR',
          'updated-dependency-files': [],
          'dependency-names': ['dependency1'],
        },
      });

      expect(result).toEqual(true);
      expect(authorClient.updatePullRequest).toHaveBeenCalled();
      expect(approverClient!.approvePullRequest).toHaveBeenCalled();
    });

    it('should skip processing "close_pull_request" if "dryRun" is true', async () => {
      options.dryRun = true;
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      const result = await (server as any).handle('1', {
        type: 'close_pull_request',
        data: { 'dependency-names': [] },
      });

      expect(result).toEqual(true);
      expect(authorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should fail processing "close_pull_request" if pull request does not exist', async () => {
      const result = await (server as any).handle('1', {
        type: 'close_pull_request',
        data: { 'dependency-names': ['dependency1'] },
      });

      expect(result).toEqual(false);
      expect(authorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should process "close_pull_request"', async () => {
      jobBuilderOutput.job['package-manager'] = 'npm_and_yarn';
      existingPullRequests.push({
        id: 11,
        properties: [
          { name: DEVOPS_PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm_and_yarn' },
          {
            name: DEVOPS_PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify([{ 'dependency-name': 'dependency1' }]),
          },
        ],
      });

      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      vi.mocked(authorClient.abandonPullRequest).mockResolvedValue(true);

      const result = await (server as any).handle('1', {
        type: 'close_pull_request',
        data: { 'dependency-names': ['dependency1'] },
      });

      expect(result).toEqual(true);
      expect(authorClient.abandonPullRequest).toHaveBeenCalled();
    });

    it('should process "record_update_job_warning" if "dryRun" is true', async () => {
      options.dryRun = true;

      vi.mocked(authorClient.addCommentThread).mockResolvedValue(1);

      const result = await (server as any).handle('1', {
        type: 'record_update_job_warning',
        data: {
          'warn-type': 'deprecated_dependency',
          'warn-title': 'Deprecated Dependency Used',
          'warn-description': 'The dependency xyz is deprecated and should be updated or removed.',
        },
      });
      expect(result).toEqual(true);
      expect(authorClient.addCommentThread).not.toHaveBeenCalled();
    });

    it('should process "record_update_job_warning"', async () => {
      server = new AzureLocalDependabotServer(options);
      server.add({
        id: '1',
        update,
        job: jobBuilderOutput.job,
        jobToken: 'test-token',
        credentialsToken: 'test-creds-token',
        credentials: jobBuilderOutput.credentials,
      });

      // Add the PR id to affectedPullRequestIds so the handler will call addCommentThread
      if (!server['affectedPullRequestIds'].get('1')) {
        server['affectedPullRequestIds'].set('1', { created: [], updated: [], closed: [] });
      }
      server['affectedPullRequestIds'].get('1')!.created.push(11);

      vi.mocked(authorClient.addCommentThread).mockResolvedValue(1);

      const result = await (server as any).handle('1', {
        type: 'record_update_job_warning',
        data: {
          'warn-type': 'deprecated_dependency',
          'warn-title': 'Deprecated Dependency Used',
          'warn-description': 'The dependency xyz is deprecated and should be updated or removed.',
        },
      });
      expect(result).toEqual(true);
      expect(authorClient.addCommentThread).toHaveBeenCalled();
    });

    it('should process "mark_as_processed"', async () => {
      const result = await (server as any).handle('1', { type: 'mark_as_processed', data: {} });
      expect(result).toEqual(true);
    });

    it('should process "record_ecosystem_versions"', async () => {
      const result = await (server as any).handle('1', { type: 'record_ecosystem_versions', data: {} });
      expect(result).toEqual(true);
    });

    it('should process "record_ecosystem_meta"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_ecosystem_meta',
        data: [{ ecosystem: { name: 'npm_any_yarn' } }],
      });
      expect(result).toEqual(true);
    });

    it('should process "record_update_job_error"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_update_job_error',
        data: { 'error-type': 'random' },
      });
      expect(result).toEqual(true);
    });

    it('should process "record_update_job_unknown_error"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_update_job_unknown_error',
        data: { 'error-type': 'random' },
      });
      expect(result).toEqual(true);
    });

    it('should process "increment_metric"', async () => {
      const result = await (server as any).handle('1', {
        type: 'increment_metric',
        data: { metric: 'random' },
      });
      expect(result).toEqual(true);
    });

    it('should process "record_metrics"', async () => {
      const result = await (server as any).handle('1', {
        type: 'record_metrics',
        data: [{ metric: 'random', value: 1, type: 'increment' }],
      });
      expect(result).toEqual(true);
    });

    it('should handle unknown output type', async () => {
      const result = await (server as any).handle('1', { type: 'non_existant_output_type', data: {} });
      expect(result).toEqual(true);
    });
  });
});
