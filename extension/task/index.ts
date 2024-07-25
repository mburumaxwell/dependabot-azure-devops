import * as tl from "azure-pipelines-task-lib/task"
import { ToolRunner } from "azure-pipelines-task-lib/toolrunner"
import { IDependabotConfig, IDependabotRegistry, IDependabotUpdate } from "./IDependabotConfig";
import getSharedVariables from "./utils/getSharedVariables";
import { parseConfigFile } from "./utils/parseConfigFile";
import { resolveAzureDevOpsIdentities } from "./utils/resolveAzureDevOpsIdentities";

async function run() {
  try {
    // Checking if docker is installed
    tl.debug("Checking for docker install ...");
    tl.which("docker", true);

    // prepare the shared variables
    const variables = getSharedVariables();

    // parse the configuration file
    const config = await parseConfigFile(variables);

    // if update identifiers are specified, select then otherwise handle all
    var updates: IDependabotUpdate[] = [];
    const targetIds = variables.targetUpdateIds;
    if (targetIds && targetIds.length > 0) {
      for (const id of targetIds) {
        updates.push(config.updates[id]);
      }
    } else {
      updates = config.updates;
    }

    // For each update run docker container
    for (const update of updates) {
      // Prepare the docker task
      // tl.which throws an error if the tool is not found
      let dockerRunner: ToolRunner = tl.tool(tl.which("docker", true));
      dockerRunner.arg(["run"]); // run command
      dockerRunner.arg(["--rm"]); // remove after execution
      dockerRunner.arg(["-i"]); // attach pseudo tty

      // Set the github token, if one is provided
      if (variables.githubAccessToken) {
        dockerRunner.arg(["-e", `GITHUB_ACCESS_TOKEN=${variables.githubAccessToken}`]);
      }

      /*
       * Set env variables in the runner for Dependabot
       */
      dockerRunner.arg(["-e", `DEPENDABOT_PACKAGE_MANAGER=${update.packageEcosystem}`]);
      dockerRunner.arg(["-e", `DEPENDABOT_OPEN_PULL_REQUESTS_LIMIT=${update.openPullRequestsLimit}`]); // always has a value

      // Set the directory or directories
      if (update.directory) {
        dockerRunner.arg(["-e", `DEPENDABOT_DIRECTORY=${update.directory}`]);
      }
      if (update.directories && update.directories.length > 0) {
        dockerRunner.arg(["-e", `DEPENDABOT_DIRECTORIES=${JSON.stringify(update.directories)}`]);
      }

      // Set the target branch
      if (update.targetBranch) {
        dockerRunner.arg(["-e", `DEPENDABOT_TARGET_BRANCH=${update.targetBranch}`]);
      }

      // Set vendored if true
      if (update.vendor === true) {
        dockerRunner.arg(["-e", 'DEPENDABOT_VENDOR=true']);
      }

      // Set the versioning strategy
      if (update.versioningStrategy) {
        dockerRunner.arg(["-e", `DEPENDABOT_VERSIONING_STRATEGY=${update.versioningStrategy}`]);
      }

      // Set the milestone, if provided
      if (update.milestone) {
        dockerRunner.arg(["-e", `DEPENDABOT_MILESTONE=${update.milestone}`]);
      }

      // Set the PR branch separator
      if (update.branchNameSeparator) {
        dockerRunner.arg(["-e", `DEPENDABOT_BRANCH_NAME_SEPARATOR=${update.branchNameSeparator}`]);
      }

      // Set exception behaviour if true
      if (update.insecureExternalCodeExecution === "deny") {
        dockerRunner.arg(["-e", 'DEPENDABOT_REJECT_EXTERNAL_CODE=true']);
      }

      // We are well aware that ignore is not passed here. It is intentional.
      // The ruby script in the docker container does it automatically.
      // If you are having issues, search for related issues such as https://github.com/tinglesoftware/dependabot-azure-devops/pull/582
      // before creating a new issue.
      // You can also test against various reproductions such as https://dev.azure.com/tingle/dependabot/_git/repro-582

      // Set the dependencies to allow
      let allow = update.allow;
      if (allow) {
        dockerRunner.arg(["-e", `DEPENDABOT_ALLOW_CONDITIONS=${allow}`]);
      }

      // Set the dependencies to ignore
      let ignore = update.ignore;
      if (ignore) {
        dockerRunner.arg(["-e", `DEPENDABOT_IGNORE_CONDITIONS=${ignore}`]);
      }

      // Set the dependency groups
      let groups = update.groups;
      if (groups) {
        dockerRunner.arg(["-e", `DEPENDABOT_DEPENDENCY_GROUPS=${groups}`]);
      }

      // Set the commit message options
      let commitMessage = update.commitMessage;
      if (commitMessage) {
        dockerRunner.arg(["-e", `DEPENDABOT_COMMIT_MESSAGE_OPTIONS=${commitMessage}`]);
      }

      // Set the requirements that should not be unlocked
      if (variables.excludeRequirementsToUnlock) {
        dockerRunner.arg(["-e", `DEPENDABOT_EXCLUDE_REQUIREMENTS_TO_UNLOCK=${variables.excludeRequirementsToUnlock}`]);
      }

      // Set the custom labels/tags
      if (update.labels) {
        dockerRunner.arg(["-e", `DEPENDABOT_LABELS=${update.labels}`]);
      }

      // Set the reviewers
      if (update.reviewers) {
        const reviewers = await resolveAzureDevOpsIdentities(variables.organizationUrl, update.reviewers)
        dockerRunner.arg(["-e", `DEPENDABOT_REVIEWERS=${JSON.stringify(reviewers.map(identity  => identity.id))}`]);
      }

      // Set the assignees
      if (update.assignees) {
        const assignees = await resolveAzureDevOpsIdentities(variables.organizationUrl, update.assignees)
        dockerRunner.arg(["-e", `DEPENDABOT_ASSIGNEES=${JSON.stringify(assignees.map(identity  => identity.id))}`]);
      }

      // Set the updater options, if provided
      if (variables.updaterOptions) {
        dockerRunner.arg(["-e", `DEPENDABOT_UPDATER_OPTIONS=${variables.updaterOptions}`]);
      }

      // Set the extra credentials
      if (config.registries != undefined && Object.keys(config.registries).length > 0) {
        let selectedRegistries: IDependabotRegistry[] = [];
        for (const reg of update.registries) {
          selectedRegistries.push(config.registries[reg]);
        }
        let extraCredentials = JSON.stringify(selectedRegistries, (k, v) => v === null ? undefined : v);
        dockerRunner.arg(["-e", `DEPENDABOT_EXTRA_CREDENTIALS=${extraCredentials}`]);
      }

      // Set exception behaviour if true
      if (variables.failOnException === true) {
        dockerRunner.arg(["-e", 'DEPENDABOT_FAIL_ON_EXCEPTION=true']);
      }

      // Set skip pull requests if true
      if (variables.skipPullRequests === true) {
        dockerRunner.arg(["-e", 'DEPENDABOT_SKIP_PULL_REQUESTS=true']);
      }

      // Set skip pull requests if true
      if (variables.commentPullRequests === true) {
        dockerRunner.arg(["-e", 'DEPENDABOT_COMMENT_PULL_REQUESTS=true']);
      }

      // Set abandon Unwanted pull requests if true
      if (variables.abandonUnwantedPullRequests === true) {
        dockerRunner.arg(["-e", 'DEPENDABOT_CLOSE_PULL_REQUESTS=true']);
      }

      // Set the security advisories
      if (variables.securityAdvisoriesFile) {
        const containerPath = "/mnt/security_advisories.json"
        dockerRunner.arg(['--mount', `type=bind,source=${variables.securityAdvisoriesFile},target=${containerPath}`]);
        dockerRunner.arg(["-e", `DEPENDABOT_SECURITY_ADVISORIES_FILE=${containerPath}`]);
      }

      /*
       * Set env variables in the runner for Azure
       */
      dockerRunner.arg(["-e", `AZURE_ORGANIZATION=${variables.organization}`]); // Set the organization
      dockerRunner.arg(["-e", `AZURE_PROJECT=${variables.project}`]); // Set the project
      dockerRunner.arg(["-e", `AZURE_REPOSITORY=${variables.repository}`]);
      dockerRunner.arg(["-e", `AZURE_ACCESS_TOKEN=${variables.systemAccessToken}`]);
      dockerRunner.arg(["-e", `AZURE_MERGE_STRATEGY=${variables.mergeStrategy}`]);

      // Set Username
      if (variables.systemAccessUser) {
        dockerRunner.arg(["-e", `AZURE_ACCESS_USERNAME=${variables.systemAccessUser}`]);
      }

      // Set the protocol if not the default value
      if (variables.protocol !== 'https') {
        dockerRunner.arg(["-e", `AZURE_PROTOCOL=${variables.protocol}`]);
      }

      // Set the host name if not the default value
      if (variables.hostname !== "dev.azure.com") {
        dockerRunner.arg(["-e", `AZURE_HOSTNAME=${variables.hostname}`]);
      }

      // Set auto complete, if set
      if (variables.setAutoComplete === true) {
        dockerRunner.arg(["-e", 'AZURE_SET_AUTO_COMPLETE=true']);

        // Set the ignore config IDs for auto complete if not the default value
        if (variables.autoCompleteIgnoreConfigIds.length > 0) {
          dockerRunner.arg(["-e", `AZURE_AUTO_COMPLETE_IGNORE_CONFIG_IDS=${JSON.stringify(variables.autoCompleteIgnoreConfigIds)}`]);
        }
      }

      // Set the port
      if (variables.port && variables.port !== "") {
        dockerRunner.arg(["-e", `AZURE_PORT=${variables.port}`]);
      }

      // Set the virtual directory
      if (variables.virtualDirectory !== "") {
        dockerRunner.arg(["-e", `AZURE_VIRTUAL_DIRECTORY=${variables.virtualDirectory}`]);
      }

      // Set auto approve
      if (variables.autoApprove === true) {
        dockerRunner.arg(["-e", 'AZURE_AUTO_APPROVE_PR=true']);

        // Set the token to use for auto approve if provided
        if (variables.autoApproveUserToken) {
          dockerRunner.arg(["-e", `AZURE_AUTO_APPROVE_USER_TOKEN=${variables.autoApproveUserToken}`]);
        }
      }

      // Set debug
      if (variables.debug === true) {
        dockerRunner.arg(["-e", 'DEPENDABOT_DEBUG=true']);
      }

      // Add in extra environment variables
      variables.extraEnvironmentVariables.forEach(extraEnvVar => {
        dockerRunner.arg(["-e", extraEnvVar]);
      });

      // Forward the host SSH socket
      if (variables.forwardHostSshSocket) {
        dockerRunner.arg(['--mount', `type=bind,source=/ssh-agent,target=/ssh-agent`]);
      }

      // Form the docker image based on the ecosystem
      let dockerImage = `ghcr.io/tinglesoftware/dependabot-updater-${update.packageEcosystem}:${variables.dockerImageTag}`;

      tl.debug(`Running docker container -> '${dockerImage}' ...`);
      dockerRunner.arg(dockerImage);

      // set the script to be run
      dockerRunner.arg(variables.command);

      // Now execute using docker
      await dockerRunner.exec();
    }

    tl.debug("Docker container execution completed!");
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
