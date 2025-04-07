﻿namespace Tingle.Dependabot;

internal static class AuthConstants
{
    // These values are fixed strings due to configuration sections
    internal const string SchemeNameManagement = "Management";
    internal const string SchemeNameServiceHooks = "ServiceHooks";
    internal const string SchemeNameUpdater = "Updater";

    internal const string PolicyNameManagement = "Management";
    internal const string PolicyNameServiceHooks = "ServiceHooks";
    internal const string PolicyNameUpdater = "Updater";
}

internal static class ErrorCodes
{
    internal const string FeaturesDisabled = "features_disabled";
    internal const string ProjectNotFound = "project_not_found";
    internal const string RepositoryNotFound = "repository_not_found";
    internal const string RepositoryUpdateNotFound = "repository_update_not_found";
}

internal static class FeatureNames
{
    internal const string DependabotDebug = "DependabotDebug";
    internal const string UpdaterV2 = "UpdaterV2"; // Whether to use V2 updater.
}
