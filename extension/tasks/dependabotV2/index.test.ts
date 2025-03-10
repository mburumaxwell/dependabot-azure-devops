import { TaskResult } from 'azure-pipelines-task-lib';
import { IPullRequestProperties } from './azure-devops/models';
import { DependabotCli } from './dependabot/cli';
import { IDependabotConfig } from './dependabot/config';
import { DependabotJobBuilder } from './dependabot/job-builder';
import { IDependabotUpdateOperationResult } from './dependabot/models';
import { DependabotOutputProcessor } from './dependabot/output-processor';
import { GitHubGraphClient } from './github';
import { performDependabotUpdatesAsync } from './index';
import { ISharedVariables } from './utils/shared-variables';

jest.mock('./dependabot/cli');
jest.mock('./dependabot/job-builder');
jest.mock('./github');

const tsDependabotJobBuilder = require('./dependabot/job-builder');
const tsDependabotOutputProcessor = require('./dependabot/output-processor');

describe('performDependabotUpdatesAsync', () => {
  let taskInputs: ISharedVariables;
  let dependabotConfig: IDependabotConfig;
  let dependabotCli: DependabotCli;
  let dependabotCliUpdateOptions: any;
  let existingPullRequests: IPullRequestProperties[];

  beforeEach(() => {
    jest.clearAllMocks();
    taskInputs = {} as ISharedVariables;
    dependabotConfig = {
      updates: [
        {
          'package-ecosystem': 'npm',
          'directory': '/',
        },
      ],
      registries: {},
    } as IDependabotConfig;
    dependabotCli = new DependabotCli(DependabotCli.CLI_PACKAGE_LATEST, null, true);
    dependabotCli.update = jest
      .fn()
      .mockResolvedValue([
        { success: true, output: { type: 'mark_as_processed', data: {} } },
      ] as IDependabotUpdateOperationResult[]);
    dependabotCliUpdateOptions = {};
    existingPullRequests = [];
  });

  it('should perform "update all" job successfully', async () => {
    const updateResult = await performDependabotUpdatesAsync(
      taskInputs,
      dependabotConfig,
      dependabotConfig.updates,
      dependabotCli,
      dependabotCliUpdateOptions,
      existingPullRequests,
    );

    expect(updateResult).toBe(TaskResult.Succeeded);
    expect(dependabotCli.update).toHaveBeenCalled();
    expect(DependabotJobBuilder.updateAllDependenciesJob).toHaveBeenCalled();
  });

  it('should skip "update all" job if open pull requests limit is reached', async () => {
    dependabotConfig.updates[0]['open-pull-requests-limit'] = 1;
    existingPullRequests.push({
      id: 1,
      properties: [
        {
          name: DependabotOutputProcessor.PR_PROPERTY_NAME_PACKAGE_MANAGER,
          value: 'npm_and_yarn',
        },
        {
          name: DependabotOutputProcessor.PR_PROPERTY_NAME_DEPENDENCIES,
          value: JSON.stringify([{ 'dependency-name': 'dependency1' }]),
        },
      ],
    });

    jest.spyOn(tsDependabotOutputProcessor, 'parsePullRequestProperties').mockReturnValue('npm_and_yarn');

    const updateResult = await performDependabotUpdatesAsync(
      taskInputs,
      dependabotConfig,
      dependabotConfig.updates,
      dependabotCli,
      dependabotCliUpdateOptions,
      existingPullRequests,
    );

    expect(updateResult).toBe(TaskResult.Succeeded);
    expect(DependabotJobBuilder.updateAllDependenciesJob).not.toHaveBeenCalled();
  });

  it('should perform "update security-only" job if open pull request limit is zero', async () => {
    dependabotConfig.updates[0]['open-pull-requests-limit'] = 0;
    const ghsaClient = new GitHubGraphClient('fake-token');
    ghsaClient.getSecurityVulnerabilitiesAsync = jest.fn().mockResolvedValue([]);

    const updateResult = await performDependabotUpdatesAsync(
      taskInputs,
      dependabotConfig,
      dependabotConfig.updates,
      dependabotCli,
      dependabotCliUpdateOptions,
      existingPullRequests,
    );

    expect(updateResult).toBe(TaskResult.Succeeded);
    expect(DependabotJobBuilder.listAllDependenciesJob).toHaveBeenCalled();
  });

  it('should perform "update pull request" job successfully if there are existing pull requests', async () => {
    dependabotConfig.updates[0]['open-pull-requests-limit'] = 1;
    existingPullRequests.push({
      id: 1,
      properties: [
        {
          name: DependabotOutputProcessor.PR_PROPERTY_NAME_PACKAGE_MANAGER,
          value: 'npm_and_yarn',
        },
        {
          name: DependabotOutputProcessor.PR_PROPERTY_NAME_DEPENDENCIES,
          value: JSON.stringify([{ 'dependency-name': 'dependency1' }]),
        },
      ],
    });

    jest.spyOn(tsDependabotJobBuilder, 'mapPackageEcosystemToPackageManager').mockReturnValue('npm_and_yarn');

    const updateResult = await performDependabotUpdatesAsync(
      taskInputs,
      dependabotConfig,
      dependabotConfig.updates,
      dependabotCli,
      dependabotCliUpdateOptions,
      existingPullRequests,
    );

    expect(updateResult).toBe(TaskResult.Succeeded);
    expect(DependabotJobBuilder.updatePullRequestJob).toHaveBeenCalled();
  });

  it('should return Succeeded when all updates are successful', async () => {
    dependabotCli.update = jest
      .fn()
      .mockResolvedValue([{ success: true, output: {} }] as IDependabotUpdateOperationResult[]);

    const updateResult = await performDependabotUpdatesAsync(
      taskInputs,
      dependabotConfig,
      dependabotConfig.updates,
      dependabotCli,
      dependabotCliUpdateOptions,
      existingPullRequests,
    );

    expect(updateResult).toBe(TaskResult.Succeeded);
  });

  it('should return SucceededWithIssues result when updates are mixture of success and failure', async () => {
    dependabotCli.update = jest.fn().mockResolvedValue([
      { success: true, output: {} },
      { success: false, output: {} },
    ] as IDependabotUpdateOperationResult[]);

    const updateResult = await performDependabotUpdatesAsync(
      taskInputs,
      dependabotConfig,
      dependabotConfig.updates,
      dependabotCli,
      dependabotCliUpdateOptions,
      existingPullRequests,
    );

    expect(updateResult).toBe(TaskResult.SucceededWithIssues);
  });

  it('should return Failed result when all updates are failure', async () => {
    dependabotCli.update = jest
      .fn()
      .mockResolvedValue([{ success: false, output: {} }] as IDependabotUpdateOperationResult[]);

    const updateResult = await performDependabotUpdatesAsync(
      taskInputs,
      dependabotConfig,
      dependabotConfig.updates,
      dependabotCli,
      dependabotCliUpdateOptions,
      existingPullRequests,
    );

    expect(updateResult).toBe(TaskResult.Failed);
  });

  it('should return Skipped result when no updates are performed', async () => {
    dependabotCli.update = jest.fn().mockResolvedValue([]);

    const updateResult = await performDependabotUpdatesAsync(
      taskInputs,
      dependabotConfig,
      dependabotConfig.updates,
      dependabotCli,
      dependabotCliUpdateOptions,
      existingPullRequests,
    );

    expect(updateResult).toBe(TaskResult.Skipped);
  });
});
