@description('Location for all resources.')
param location string = resourceGroup().location

@minLength(5)
@maxLength(24)
@description('Name of the resources.')
param name string = 'paklo'

var vercelEnvironments = ['production', 'preview']
var administratorLoginPasswordMongo = '${skip(uniqueString(resourceGroup().id), 5)}^${uniqueString('mongo-password', resourceGroup().id)}' // e.g. abcde%zecnx476et7xm (19 characters)
var blobContainers = ['dependabot-job-logs']

/* Managed Identity */
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: name
  location: location
  properties: { isolationScope: 'None' }

  // https://vercel.com/docs/oidc/azure
  @batchSize(1) // anything more than 1 causes an error
  resource vercelCredentials 'federatedIdentityCredentials' = [
    for env in vercelEnvironments: {
      name: 'vercel-mburumaxwell-${env}'
      properties: {
        audiences: ['https://vercel.com/mburumaxwell']
        issuer: 'https://oidc.vercel.com/mburumaxwell'
        subject: 'owner:mburumaxwell:project:paklo:environment:${env}'
      }
    }
  ]
}

/* Key Vault */
resource keyVault 'Microsoft.KeyVault/vaults@2025-05-01' = {
  name: name
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { name: 'standard', family: 'A' }
    enabledForDeployment: true
    enabledForDiskEncryption: true
    enabledForTemplateDeployment: true
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
  }

  resource mongoPasswordSecret 'secrets' = {
    name: 'mongo-password'
    properties: { contentType: 'text/plain', value: administratorLoginPasswordMongo }
  }
}

/* Storage Account */
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: name
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
    minimumTlsVersion: 'TLS1_2'
  }

  resource blobServices 'blobServices' existing = {
    name: 'default'

    resource containers 'containers' = [
      for bc in blobContainers: {
        name: bc
        properties: {
          publicAccess: 'None'
          defaultEncryptionScope: '$account-encryption-key'
          denyEncryptionScopeOverride: false
        }
      }
    ]
  }
}

/* LogAnalytics */
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2025-07-01' = {
  name: name
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    workspaceCapping: { dailyQuotaGb: json('0.167') } // low so as not to pass the 5GB limit per subscription
    retentionInDays: 30
  }
}

/* MongoDB Cluster */
resource mongoCluster 'Microsoft.DocumentDB/mongoClusters@2025-09-01' = {
  name: name
  location: location
  properties: {
    #disable-next-line use-secure-value-for-secure-inputs
    administrator: { userName: 'puppy', password: administratorLoginPasswordMongo }
    serverVersion: '8.0'
    compute: { tier: 'Free' } // we remain free until, there are paying users :)
    storage: { sizeGb: 32, type: 'PremiumSSD' }
    sharding: { shardCount: 1 }
    highAvailability: { targetMode: 'Disabled' }
    publicNetworkAccess: 'Enabled'
    authConfig: { allowedModes: ['NativeAuth'] }
    dataApi: { mode: 'Disabled' }
  }

  // resource allowAzure 'firewallRules' = {
  //   name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  //   properties: { endIpAddress: '0.0.0.0', startIpAddress: '0.0.0.0' }
  // }

  // allowing all IPs for now, because we deploy the web on Vercel and it needs to access the database
  // no fixed IPs are provided by Vercel
  resource allowAll 'firewallRules' = {
    name: 'AllowAll_IPs'
    properties: { startIpAddress: '0.0.0.0', endIpAddress: '255.255.255.255' }
  }
}

/* AppConfiguration */
resource appConfiguration 'Microsoft.AppConfiguration/configurationStores@2024-06-01' = {
  name: name
  location: location
  properties: {
    dataPlaneProxy: { authenticationMode: 'Local', privateLinkDelegation: 'Disabled' }
    softDeleteRetentionInDays: 0 /* Free does not support this */
    defaultKeyValueRevisionRetentionPeriodInSeconds: 604800 /* 7 days */
    publicNetworkAccess: 'Enabled'
  }
  sku: { name: 'free' }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${managedIdentity.id}': {} }
  }
}

/* Container App Environment */
resource appEnvironment 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: name
  location: location
  properties: {
    peerAuthentication: { mtls: { enabled: false } }
    peerTrafficConfiguration: { encryption: { enabled: false } }
    publicNetworkAccess: 'Enabled'
    workloadProfiles: [{ name: 'Consumption', workloadProfileType: 'Consumption' }]
    appLogsConfiguration: { destination: 'azure-monitor' }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${managedIdentity.id}': {} }
  }
}
resource appEnvironmentDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'console-logs'
  scope: appEnvironment
  properties: {
    // this could be changed to EventHubs if streaming logs is needed in the future
    storageAccountId: storageAccount.id
    logs: [
      { category: 'ContainerAppConsoleLogs', enabled: true, retentionPolicy: { days: 0, enabled: false } }
      // disabled but added here for reference and easier to detect changed on deploy
      { category: 'ContainerAppSystemLogs', enabled: false, retentionPolicy: { days: 0, enabled: false } }
      { category: 'AppEnvSpringAppConsoleLogs', enabled: false, retentionPolicy: { days: 0, enabled: false } }
      { category: 'AppEnvSessionConsoleLogs', enabled: false, retentionPolicy: { days: 0, enabled: false } }
      { category: 'AppEnvSessionPoolEventLogs', enabled: false, retentionPolicy: { days: 0, enabled: false } }
      { category: 'AppEnvSessionLifeCycleLogs', enabled: false, retentionPolicy: { days: 0, enabled: false } }
    ]
    metrics: [
      { category: 'AllMetrics', enabled: false, retentionPolicy: { days: 0, enabled: false } }
    ]
  }
}
resource appEnvironmentLogsRetention 'Microsoft.Storage/storageAccounts/managementPolicies@2025-06-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'delete-old-console-logs'
          enabled: true
          type: 'Lifecycle'
          definition: {
            actions: { baseBlob: { delete: { daysAfterModificationGreaterThan: 14 } } }
            filters: {
              blobTypes: ['blockBlob', 'appendBlob']
              prefixMatch: ['insights-logs-containerappconsolelogs/ResourceId=${toUpper(appEnvironment.id)}/']
            }
          }
        }
      ]
    }
  }
}

/* Idler app (Used to prevent the environment from being shutdown) */
resource app 'Microsoft.App/containerApps@2025-07-01' = {
  name: 'idler'
  location: location
  properties: {
    managedEnvironmentId: appEnvironment.id
    workloadProfileName: 'Consumption'
    template: {
      containers: [
        {
          name: 'idler'
          image: 'mcr.microsoft.com/k8se/quickstart'
          // these are the least resources we can provision
          resources: { cpu: json('0.25'), memory: '0.5Gi' }
        }
      ]
      scale: { minReplicas: 0, maxReplicas: 1, cooldownPeriod: 300, pollingInterval: 30 }
    }
  }
}

/* Role Assignments */
var roles = [
  { name: 'App Configuration Data Reader', id: '516239f1-63e1-4d78-a4de-a74fb236a071' } // Allow read access to App Configuration
  // { name: 'Log Analytics Reader', id: '73c42c96-874c-492b-b04d-ab87d138a893' } // Allow read access to Log Analytics
  { name: 'Key Vault Administrator', id: '00482a5a-887f-4fb3-b363-3b7fe8e74483' } // Perform all data plane operations on a key vault
  { name: 'Storage Blob Data Contributor', id: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe' } // Read, write, and delete Azure Storage containers and blobs
]

resource roleAssignments 'Microsoft.Authorization/roleAssignments@2022-04-01' = [
  for role in roles: {
    name: guid(managedIdentity.id, role.name)
    scope: resourceGroup()
    properties: {
      roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', role.id)
      principalId: managedIdentity.properties.principalId
    }
  }
]

module jobs 'jobs.bicep' = {
  name: 'deploy-jobs'
  scope: resourceGroup('${resourceGroup().name}-JOBS')
  params: { name: name, mainRGName: resourceGroup().name }
}

output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output mongoConnectionString string = replace(
  mongoCluster.properties.connectionString,
  '<user>',
  mongoCluster.properties.administrator.userName
)
