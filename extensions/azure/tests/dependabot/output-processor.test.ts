import { error, warning } from 'azure-pipelines-task-lib/task';
import { readFile } from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AzureDevOpsWebApiClient } from '../../src/azure-devops/client';
import {
  DEVOPS_PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
  DEVOPS_PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER,
  type IPullRequestProperties,
} from '../../src/azure-devops/models';
import { type IDependabotUpdateOperation } from '../../src/dependabot/models';
import { DependabotDependenciesSchema, DependabotOutputProcessor } from '../../src/dependabot/output-processor';
import { type ISharedVariables } from '../../src/utils/shared-variables';

vi.mock('../../src/azure-devops/client');
vi.mock('../../src/utils/shared-variables');
vi.mock('azure-pipelines-task-lib/task');

describe('DependabotOutputProcessor', () => {
  let processor: DependabotOutputProcessor;
  let taskInputs: ISharedVariables;
  let prAuthorClient: AzureDevOpsWebApiClient;
  let prApproverClient: AzureDevOpsWebApiClient;
  let existingBranchNames: string[];
  let existingPullRequests: IPullRequestProperties[];

  beforeEach(() => {
    taskInputs = {} as ISharedVariables;
    prAuthorClient = new AzureDevOpsWebApiClient('http://localhost:8081', 'token1', true);
    prApproverClient = new AzureDevOpsWebApiClient('http://localhost:8081', 'token1', true);
    existingBranchNames = [];
    existingPullRequests = [];
    processor = new DependabotOutputProcessor(
      taskInputs,
      prAuthorClient,
      prApproverClient,
      existingBranchNames,
      existingPullRequests,
      true,
    );
  });

  describe('process', () => {
    let update: IDependabotUpdateOperation;
    let data: Record<string, unknown>;

    beforeEach(() => {
      vi.clearAllMocks();
      update = {
        job: {
          'id': 'job1',
          'package-manager': 'npm',
          'source': {
            hostname: 'localhost:8081',
            provider: 'azure',
            repo: 'testproject/_git/test-repo',
          },
        },
        credentials: [],
        config: {
          'package-ecosystem': 'npm',
        },
      };
      data = {};
    });

    it('should process "update_dependency_list"', async () => {
      const result = await processor.process(update, 'update_dependency_list', {
        ...data,
        dependencies: [],
        dependency_files: [],
      });

      expect(result).toBe(true);
    });

    it('should skip processing "create_pull_request" if "dryRun" is true', async () => {
      taskInputs.dryRun = true;

      const result = await processor.process(update, 'create_pull_request', data);

      expect(result).toBe(true);
      expect(prAuthorClient.createPullRequest).not.toHaveBeenCalled();
    });

    it('should skip processing "create_pull_request" if open pull request limit is reached', async () => {
      update.config['open-pull-requests-limit'] = 1;
      existingPullRequests.push({ id: 1 } as IPullRequestProperties);
      const result = await processor.process(update, 'create_pull_request', data);

      expect(result).toBe(true);
      expect(prAuthorClient.createPullRequest).not.toHaveBeenCalled();
    });

    it('should process "create_pull_request"', async () => {
      taskInputs.autoApprove = true;
      data = {
        'pr-title': 'Test PR',
        'base-commit-sha': '123456',
        'pr-body': 'Test body',
        'commit-message': 'Test commit message',
        'dependencies': [],
        'updated-dependency-files': [],
      };

      prAuthorClient.createPullRequest = vi.fn().mockResolvedValue(1);
      prAuthorClient.getDefaultBranch = vi.fn().mockResolvedValue('main');
      prApproverClient.approvePullRequest = vi.fn().mockResolvedValue(true);

      const result = await processor.process(update, 'create_pull_request', data);

      expect(result).toBe(true);
      expect(prAuthorClient.createPullRequest).toHaveBeenCalled();
      expect(prApproverClient.approvePullRequest).toHaveBeenCalled();
    });

    it('should skip processing "update_pull_request" if "dryRun" is false', async () => {
      taskInputs.dryRun = true;

      const result = await processor.process(update, 'update_pull_request', data);

      expect(result).toBe(true);
      expect(prAuthorClient.updatePullRequest).not.toHaveBeenCalled();
    });

    it('should fail processing "update_pull_request" if pull request does not exist', async () => {
      data = {
        'dependency-names': ['dependency1'],
      };

      const result = await processor.process(update, 'update_pull_request', data);

      expect(result).toBe(false);
      expect(prAuthorClient.updatePullRequest).not.toHaveBeenCalled();
    });

    it('should process "update_pull_request"', async () => {
      taskInputs.autoApprove = true;
      update.job['package-manager'] = 'npm';
      data = {
        'base-commit-sha': '123456',
        'dependency-names': ['dependency1'],
        'dependencies': [],
        'updated-dependency-files': [],
      };

      existingPullRequests.push({
        id: 1,
        properties: [
          { name: DEVOPS_PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm' },
          {
            name: DEVOPS_PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify([{ 'dependency-name': 'dependency1' }]),
          },
        ],
      });

      prAuthorClient.updatePullRequest = vi.fn().mockResolvedValue(true);
      prApproverClient.approvePullRequest = vi.fn().mockResolvedValue(true);

      const result = await processor.process(update, 'update_pull_request', data);

      expect(result).toBe(true);
      expect(prAuthorClient.updatePullRequest).toHaveBeenCalled();
      expect(prApproverClient.approvePullRequest).toHaveBeenCalled();
    });

    it('should skip processing "close_pull_request" if "dryRun" is true', async () => {
      taskInputs.dryRun = true;

      const result = await processor.process(update, 'close_pull_request', data);

      expect(result).toBe(true);
      expect(prAuthorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should fail processing "close_pull_request" if pull request does not exist', async () => {
      taskInputs.dryRun = false;
      data = {
        'dependency-names': ['dependency1'],
      };

      const result = await processor.process(update, 'close_pull_request', data);

      expect(result).toBe(false);
      expect(prAuthorClient.abandonPullRequest).not.toHaveBeenCalled();
    });

    it('should process "close_pull_request"', async () => {
      taskInputs.dryRun = false;
      update.job['package-manager'] = 'npm';
      data = {
        'dependency-names': ['dependency1'],
      };
      existingPullRequests.push({
        id: 1,
        properties: [
          { name: DEVOPS_PR_PROPERTY_DEPENDABOT_PACKAGE_MANAGER, value: 'npm' },
          {
            name: DEVOPS_PR_PROPERTY_DEPENDABOT_DEPENDENCIES,
            value: JSON.stringify([{ 'dependency-name': 'dependency1' }]),
          },
        ],
      });

      prAuthorClient.abandonPullRequest = vi.fn().mockResolvedValue(true);

      const result = await processor.process(update, 'close_pull_request', data);

      expect(result).toBe(true);
      expect(prAuthorClient.abandonPullRequest).toHaveBeenCalled();
    });

    it('should process "mark_as_processed"', async () => {
      const result = await processor.process(update, 'mark_as_processed', data);

      expect(result).toBe(true);
    });

    it('should process "record_ecosystem_versions"', async () => {
      const result = await processor.process(update, 'record_ecosystem_versions', data);

      expect(result).toBe(true);
    });

    it('should process "record_ecosystem_meta"', async () => {
      const result = await processor.process(update, 'record_ecosystem_meta', data);

      expect(result).toBe(true);
    });

    it('should process "record_update_job_error"', async () => {
      const result = await processor.process(update, 'record_update_job_error', data);

      expect(result).toBe(false);
      expect(error).toHaveBeenCalled();
    });

    it('should process "record_update_job_unknown_error"', async () => {
      const result = await processor.process(update, 'record_update_job_unknown_error', data);

      expect(result).toBe(false);
      expect(error).toHaveBeenCalled();
    });

    it('should process "increment_metric"', async () => {
      const result = await processor.process(update, 'increment_metric', data);

      expect(result).toBe(true);
    });

    it('should handle unknown output type', async () => {
      const result = await processor.process(update, 'non_existant_output_type', data);

      expect(result).toBe(true);
      expect(warning).toHaveBeenCalled();
    });
  });

  describe('schema', () => {
    it('works for a result from python pip', async () => {
      const raw = JSON.parse(await readFile('tests/update_dependency_list/python-pip.json', 'utf-8'));
      const data = DependabotDependenciesSchema.parse(raw['data']);

      expect(data['dependency_files']).toEqual(['/requirements.txt']);
      expect(data['dependencies']!.length).toEqual(22);

      expect(data['dependencies']![0]!.name).toEqual('asgiref');
      expect(data['dependencies']![0]!.version).toEqual('3.7.2');
      expect(data['dependencies']![0]!.requirements!.length).toEqual(1);
      expect(data['dependencies']![0]!.requirements![0]!.file).toEqual('requirements.txt');
      expect(data['dependencies']![0]!.requirements![0]!.requirement).toEqual('==3.7.2');
      expect(data['dependencies']![0]!.requirements![0]!.groups).toEqual(['dependencies']);
    });

    it('works for a result from python poetry', async () => {
      const raw = JSON.parse(await readFile('tests/update_dependency_list/python-poetry.json', 'utf-8'));
      const data = DependabotDependenciesSchema.parse(raw['data']);

      expect(data['dependency_files']).toEqual(['/pyproject.toml']);
      expect(data['dependencies']!.length).toEqual(1);

      expect(data['dependencies']![0]!.name).toEqual('requests');
      expect(data['dependencies']![0]!.version).toBeNull();
      expect(data['dependencies']![0]!.requirements!.length).toEqual(1);
      expect(data['dependencies']![0]!.requirements![0]!.file).toEqual('pyproject.toml');
      expect(data['dependencies']![0]!.requirements![0]!.requirement).toEqual('^2.31.0');
      expect(data['dependencies']![0]!.requirements![0]!.groups).toEqual(['dependencies']);
    });

    it('works for a result from nuget', async () => {
      const raw = JSON.parse(await readFile('tests/update_dependency_list/nuget.json', 'utf-8'));
      const data = DependabotDependenciesSchema.parse(raw['data']);

      expect(data['dependency_files']).toEqual(['/Root.csproj']);
      expect(data['dependencies']!.length).toEqual(76);

      expect(data['dependencies']![0]!.name).toEqual('Azure.Core');
      expect(data['dependencies']![0]!.version).toEqual('1.35.0');
      expect(data['dependencies']![0]!.requirements!.length).toEqual(0);

      expect(data['dependencies']![3]!.name).toEqual('GraphQL.Server.Ui.Voyager');
      expect(data['dependencies']![3]!.version).toEqual('8.1.0');
      expect(data['dependencies']![3]!.requirements!.length).toEqual(1);
      expect(data['dependencies']![3]!.requirements![0]!.file).toEqual('/Root.csproj');
      expect(data['dependencies']![3]!.requirements![0]!.requirement).toEqual('8.1.0');
      expect(data['dependencies']![3]!.requirements![0]!.groups).toEqual(['dependencies']);
    });
  });
});
