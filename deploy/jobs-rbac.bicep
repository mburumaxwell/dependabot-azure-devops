@minLength(5)
@maxLength(24)
@description('Name of the resources.')
param name string

@description('Name of the main resource group where the managed identity is located.')
param mainRGName string

/* Managed Identity */
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' existing = {
  name: name
  scope: resourceGroup(mainRGName)
}

var roles = [
  { name: 'Contributor', id: 'b24988ac-6180-42a0-ab88-20f7382dd24c' } // needed to create resources in this resource group (i.e. the jobs)
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
