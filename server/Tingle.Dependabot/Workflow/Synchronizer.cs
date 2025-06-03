﻿using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using Tingle.Dependabot.Events;
using Tingle.Dependabot.Models;
using Tingle.Dependabot.Models.Azure;
using Tingle.Dependabot.Models.Dependabot;
using Tingle.Dependabot.Models.Management;
using Tingle.EventBus;
using Tingle.Extensions.Primitives;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace Tingle.Dependabot.Workflow;

public interface ISynchronizer
{
    Task SynchronizeAsync(Project project, bool trigger, CancellationToken cancellationToken = default);
    Task SynchronizeAsync(Project project, Repository repository, bool trigger, CancellationToken cancellationToken = default);
    Task SynchronizeAsync(Project project, string? repositoryProviderId, bool trigger, CancellationToken cancellationToken = default);
}

internal class Synchronizer(MainDbContext dbContext,
                            IAzureDevOpsProvider adoProvider,
                            IEventPublisher publisher,
                            ILogger<Synchronizer> logger) : ISynchronizer
{
    private readonly IDeserializer yamlDeserializer = new DeserializerBuilder().WithNamingConvention(HyphenatedNamingConvention.Instance)
                                                                               .IgnoreUnmatchedProperties()
                                                                               .Build();

    public async Task SynchronizeAsync(Project project, bool trigger, CancellationToken cancellationToken = default)
    {
        // skip if the project last synchronization is less than 1 hour ago
        if ((DateTimeOffset.UtcNow - project.Synchronized) <= TimeSpan.FromHours(1))
        {
            logger.SkippingSyncProjectTooSoon(project.Id, project.Synchronized);
            return;
        }

        // update the project (it may have changed name or visibility)
        var tp = await adoProvider.GetProjectAsync(project, cancellationToken);
        var @private = tp.Visibility is not AzdoProjectVisibility.Public;
        if (!string.Equals(project.Name, tp.Name, StringComparison.Ordinal)
            || !string.Equals(project.Description, tp.Description, StringComparison.Ordinal)
            || @private != project.Private)
        {
            project.Name = tp.Name;
            project.Description = tp.Description;
            project.Private = @private;
            project.Updated = DateTimeOffset.UtcNow;
        }

        // track the synchronization pairs
        var syncPairs = new List<(SynchronizerConfigurationItem, Repository?)>();

        // get the repositories from Azure
        logger.SyncListingRepositories(project.Id);
        var adoRepos = await adoProvider.GetRepositoriesAsync(project, cancellationToken);
        logger.SyncListingRepositories(adoRepos.Count, project.Id);
        var adoReposMap = adoRepos.ToDictionary(r => r.Id.ToString(), r => r);

        // synchronize each project
        foreach (var (adoRepositoryId, adoRepo) in adoReposMap)
        {
            // skip disabled or fork repositories
            if (adoRepo.IsDisabled is true || adoRepo.IsFork)
            {
                logger.SkippingSyncRepositoryDisabledOrFork(adoRepo.Name, project.Id);
                continue;
            }

            // get the repository from the database
            var adoRepositoryName = adoRepo.Name;
            var repository = await (from r in dbContext.Repositories
                                    where r.ProjectId == project.Id
                                    where r.ProviderId == adoRepositoryId
                                    select r).SingleOrDefaultAsync(cancellationToken);

            var item = await adoProvider.GetConfigurationFileAsync(project: project,
                                                                   repositoryIdOrName: adoRepositoryId,
                                                                   cancellationToken: cancellationToken);

            // Track for further synchronization
            var sci = new SynchronizerConfigurationItem(project.Url.MakeRepositorySlug(adoRepo.Name), adoRepo, item);
            syncPairs.Add((sci, repository));
        }

        // remove repositories that are no longer tracked (i.e. the repository was removed)
        var providerIdsToKeep = syncPairs.Where(p => p.Item1.HasConfiguration).Select(p => p.Item1.Id).ToList();
        var toDeleteQuery = dbContext.Repositories.Where(r => !providerIdsToKeep.Contains(r.ProviderId!));
        var deletable = await toDeleteQuery.ToListAsync(cancellationToken);
        dbContext.RemoveRange(deletable);
        await dbContext.SaveChangesAsync(cancellationToken);
        if (deletable.Count > 0) logger.SyncDeletedRepositories(deletable.Count, project.Id);

        // synchronize each repository
        foreach (var (pi, repository) in syncPairs)
        {
            await SynchronizeAsync(project, repository, pi, trigger, cancellationToken);
        }

        // set the last synchronization time on the project
        project.Synchronized = DateTimeOffset.UtcNow;
    }

    public async Task SynchronizeAsync(Project project, Repository repository, bool trigger, CancellationToken cancellationToken = default)
    {
        // get repository
        var adoRepo = await adoProvider.GetRepositoryAsync(project: project,
                                                           repositoryIdOrName: repository.ProviderId!,
                                                           cancellationToken: cancellationToken);

        // skip disabled or fork repository
        if (adoRepo.IsDisabled is true || adoRepo.IsFork)
        {
            logger.SkippingSyncRepositoryDisabledOrFork(adoRepo.Name, project.Id);
            return;
        }

        // get the configuration file
        var item = await adoProvider.GetConfigurationFileAsync(project: project,
                                                               repositoryIdOrName: repository.ProviderId!,
                                                               cancellationToken: cancellationToken);

        // perform synchronization
        var sci = new SynchronizerConfigurationItem(project.Url.MakeRepositorySlug(adoRepo.Name), adoRepo, item);
        await SynchronizeAsync(project, repository, sci, trigger, cancellationToken);
    }

    public async Task SynchronizeAsync(Project project, string? repositoryProviderId, bool trigger, CancellationToken cancellationToken = default)
    {
        // get repository
        var adoRepo = await adoProvider.GetRepositoryAsync(project: project,
                                                           repositoryIdOrName: repositoryProviderId!,
                                                           cancellationToken: cancellationToken);

        // skip disabled or fork repository
        if (adoRepo.IsDisabled is true || adoRepo.IsFork)
        {
            logger.SkippingSyncRepositoryDisabledOrFork(adoRepo.Name, project.Id);
            return;
        }

        // get the configuration file
        var item = await adoProvider.GetConfigurationFileAsync(project: project,
                                                               repositoryIdOrName: repositoryProviderId!,
                                                               cancellationToken: cancellationToken);

        var repository = await (from r in dbContext.Repositories
                                where r.ProviderId == repositoryProviderId
                                select r).SingleOrDefaultAsync(cancellationToken);

        // perform synchronization
        var sci = new SynchronizerConfigurationItem(project.Url.MakeRepositorySlug(adoRepo.Name), adoRepo, item);
        await SynchronizeAsync(project, repository, sci, trigger, cancellationToken);
    }

    internal async Task SynchronizeAsync(Project project,
                                         Repository? repository,
                                         SynchronizerConfigurationItem providerInfo,
                                         bool trigger,
                                         CancellationToken cancellationToken = default)
    {
        // ensure not null (can be null when deleted and an event is sent)
        if (!providerInfo.HasConfiguration)
        {
            // delete repository
            if (repository is not null)
            {
                logger.SyncDeletingRepository(repositorySlug: repository.Slug, projectId: project.Id);
                dbContext.Repositories.Remove(repository);
                await dbContext.SaveChangesAsync(cancellationToken);

                // publish RepositoryDeletedEvent event
                var evt = new RepositoryDeletedEvent { ProjectId = project.Id, RepositoryId = repository.Id, };
                await publisher.PublishAsync(evt, cancellationToken: cancellationToken);
            }

            return;
        }

        // check if the file changed (different commit)
        bool commitChanged = true; // assume changes unless otherwise
        var commitId = providerInfo.CommitId;
        if (repository is not null)
        {
            commitChanged = !string.Equals(commitId, repository.LatestCommit);
        }

        // create repository
        RepositoryCreatedEvent? rce = null;
        if (repository is null)
        {
            repository = new Repository
            {
                Id = $"repo_{Ksuid.Generate()}",
                Created = DateTimeOffset.UtcNow,
                ProjectId = project.Id,
                ProviderId = providerInfo.Id,
            };
            await dbContext.Repositories.AddAsync(repository, cancellationToken);
            rce = new RepositoryCreatedEvent { ProjectId = project.Id, RepositoryId = repository.Id, };
        }

        // if the name of the repository has changed then we assume the commit changed so that we update stuff
        if (repository.Name != providerInfo.Name) commitChanged = true;

        if (commitChanged)
        {
            logger.SyncConfigFileChanged(repositorySlug: providerInfo.Slug, projectId: project.Id);

            // set/update existing values
            repository.Updated = DateTimeOffset.UtcNow;
            repository.Name = providerInfo.Name;
            repository.Slug = providerInfo.Slug;
            repository.LatestCommit = commitId;
            repository.ConfigFileContents = providerInfo.Content;

            try
            {
                var configuration = yamlDeserializer.Deserialize<DependabotConfiguration>(repository.ConfigFileContents);
                RecursiveValidator.ValidateObjectRecursive(configuration);

                // set the registries
                repository.Registries = configuration.Registries;

                // set the updates a fresh
                var updates = configuration.Updates!;
                repository.Updates = [.. updates.Select(update => new RepositoryUpdate(update)
                {
                    Files = [], // files are populated by an API call from Ruby during job execution

                    LatestJobId = null,
                    LatestJobStatus = null,
                    LatestUpdate = null,
                })];
            }
            catch (YamlDotNet.Core.YamlException ye)
            {
                logger.SyncConfigFileInvalidStructure(ye, repositorySlug: repository.Slug, projectId: project.Id);
                repository.SyncException = ye.Message;
            }
            catch (ValidationException ve)
            {
                logger.SyncConfigFileInvalidData(ve, repositorySlug: repository.Slug, projectId: project.Id);
                repository.SyncException = ve.Message;
            }

            // Update the database
            await dbContext.SaveChangesAsync(cancellationToken);

            // publish RepositoryCreatedEvent or RepositoryUpdatedEvent event
            if (rce is not null)
            {
                await publisher.PublishAsync(rce, cancellationToken: cancellationToken);
            }
            else
            {
                var evt = new RepositoryUpdatedEvent { ProjectId = project.Id, RepositoryId = repository.Id, };
                await publisher.PublishAsync(evt, cancellationToken: cancellationToken);
            }

            if (trigger)
            {
                // publish events to run update jobs for the whole repository
                var evts = repository.Updates.Select((update, index) => new RunUpdateJobEvent
                {
                    ProjectId = project.Id,
                    RepositoryId = repository.Id,
                    RepositoryUpdateId = index,
                    Trigger = UpdateJobTrigger.Synchronization,
                }).ToList();

                await publisher.PublishAsync<RunUpdateJobEvent>(evts, cancellationToken: cancellationToken);
            }
        }
    }
}

public readonly record struct SynchronizerConfigurationItem(string Id, string Name, string Slug, string? CommitId, string? Content)
{
    public SynchronizerConfigurationItem(string slug, AzdoRepository repo, AzdoRepositoryItem? item)
        : this(Id: repo.Id,
               Name: repo.Name,
               Slug: slug,
               CommitId: item?.LatestProcessedChange.CommitId,
               Content: item?.Content)
    { }

    [MemberNotNullWhen(true, nameof(CommitId))]
    [MemberNotNullWhen(true, nameof(Content))]
    public bool HasConfiguration => !string.IsNullOrEmpty(CommitId) && !string.IsNullOrEmpty(Content);
}
