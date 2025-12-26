@description('Location for all resources.')
param location string

@minLength(5)
@maxLength(15)
@description('Name of the resources.')
param name string

@maxLength(5)
@description('Paklo region code')
param suffix string

var blobContainers = ['dependabot-job-logs']

/* Key Vault */
resource keyVault 'Microsoft.KeyVault/vaults@2025-05-01' = {
  name: '${name}${suffix}'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { name: 'standard', family: 'A' }
    enabledForDeployment: false
    enableRbacAuthorization: true
    enableSoftDelete: false
  }
}

/* Storage Account */
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: '${name}${suffix}'
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

/* Container App Environment */
resource appEnvironment 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: '${name}${suffix}'
  location: location
  properties: {
    peerAuthentication: { mtls: { enabled: false } }
    peerTrafficConfiguration: { encryption: { enabled: false } }
    publicNetworkAccess: 'Enabled'
    workloadProfiles: [{ name: 'Consumption', workloadProfileType: 'Consumption' }]
    appLogsConfiguration: { destination: 'azure-monitor' }
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
resource idlerApp 'Microsoft.App/containerApps@2025-07-01' = {
  name: '${name}${suffix}-idler'
  location: location
  properties: {
    managedEnvironmentId: appEnvironment.id
    workloadProfileName: 'Consumption'
    configuration: { maxInactiveRevisions: 1 }
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
