@description('Location for all resources.')
param location string = resourceGroup().location

@minLength(5)
@maxLength(15)
@description('Name of the resources.')
param name string = 'paklo'

var vercelEnvironments = ['production', 'preview']
var administratorLoginPasswordMongo = '${skip(uniqueString(resourceGroup().id), 5)}^${uniqueString('mongo-password', resourceGroup().id)}' // e.g. abcde%zecnx476et7xm (19 characters)
var administratorLoginPasswordPostgres = '${skip(uniqueString(resourceGroup().id), 5)}%${uniqueString('postgres-password', resourceGroup().id)}' // e.g. abcde%zecnx476et7xm (19 characters)

type RegionInfo = { name: string, location: string }
var regions RegionInfo[] = [
  { name: 'dub', location: 'northeurope' }
  { name: 'lhr', location: 'uksouth' }
  // { name: 'cle', location: 'eastus2' }
  // { name: 'sfo', location: 'westus' }
  // { name: 'syd', location: 'australiaeast' }
]

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

  resource postgresPasswordSecret 'secrets' = {
    name: 'postgres-password'
    properties: { contentType: 'text/plain', value: administratorLoginPasswordPostgres }
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

/* Postgres Server */
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2025-08-01' = if (false) {
  name: name
  location: location
  properties: {
    version: '18'
    authConfig: {
      activeDirectoryAuth: 'Enabled'
      passwordAuth: 'Enabled'
      tenantId: tenant().tenantId
    }
    availabilityZone: '1'
    administratorLogin: 'chipmunk'
    #disable-next-line use-secure-value-for-secure-inputs
    administratorLoginPassword: administratorLoginPasswordPostgres
    backup: { geoRedundantBackup: 'Enabled', backupRetentionDays: 35 } // max is 35 days
    storage: {
      storageSizeGB: 32
      autoGrow: 'Disabled'
      tier: 'P4'
      iops: 120
    }
    replica: { role: 'Primary' }
    replicationRole: 'Primary'
    maintenanceWindow: { customWindow: 'Enabled', dayOfWeek: 0, startHour: 0, startMinute: 0 }
    dataEncryption: { type: 'SystemManaged' }
    network: { publicNetworkAccess: 'Enabled' }
    highAvailability: { mode: 'Disabled' }
  }
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  identity: { type: 'UserAssigned', userAssignedIdentities: { '${managedIdentity.id}': {} } }

  // resource firewallRuleForAzure 'firewallRules' = {
  //   name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  //   properties: { endIpAddress: '0.0.0.0', startIpAddress: '0.0.0.0' }
  // }

  // allowing all IPs for now, because we deploy the web on Vercel and it needs to access the database
  // no fixed IPs are provided by Vercel
  resource allowAll 'firewallRules' = {
    name: 'AllowAll_IPs'
    properties: { startIpAddress: '0.0.0.0', endIpAddress: '255.255.255.255' }
  }

  resource databases 'databases' = {
    name: 'paklodb'
    properties: { charset: 'UTF8', collation: 'en_US.utf8' }
  }
}

/* Region-specific resources */
module jobsRegion 'jobs-region.bicep' = [
  for region in regions: {
    name: 'region-${region.name}'
    scope: resourceGroup('${resourceGroup().name}-JOBS')
    params: {
      location: region.location
      name: name
      // storage account must use numbers and lower-case letters only
      // hence no hyphen is used here
      suffix: region.name
    }
  }
]

/* Role Assignments */
var roles = [
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

/* RBAC in JOBS RG */
module jobsRbac 'jobs-rbac.bicep' = {
  name: 'rbac'
  scope: resourceGroup('${resourceGroup().name}-JOBS')
  params: { name: name, mainRGName: resourceGroup().name }
}

output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output mongoConnectionString string = replace(
  mongoCluster.properties.connectionString,
  '<user>',
  mongoCluster.properties.administrator.userName
)
output postgresServerFqdn string = postgresServer.?properties.fullyQualifiedDomainName ?? ''
