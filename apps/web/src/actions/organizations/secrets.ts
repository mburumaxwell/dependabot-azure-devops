'use server';

import { deleteKeyVaultSecret, getKeyVaultSecret, setKeyVaultSecret } from '@/lib/azure';
import { PakloId } from '@/lib/ids';
import { type OrganizationSecret, prisma } from '@/lib/prisma';
import { type SecretValidationResult, validateSecretNameFormat } from '@/lib/secrets';

/** Validates if a secret name and its uniqueness within an organization */
export async function validateSecretName({
  organizationId,
  name,
  id, // optional, for updates
}: {
  organizationId: string;
  name: string;
  /** Optional secret ID to exclude from uniqueness check */
  id?: string;
}): Promise<SecretValidationResult> {
  const { valid, error } = validateSecretNameFormat(name);
  if (!valid) return { valid: false, error };

  // Check uniqueness within the organization
  const existing = await prisma.organizationSecret.findFirst({
    where: { organizationId, name, NOT: { id } },
  });
  if (existing) {
    return { valid: false, error: 'A secret with this name already exists' };
  }

  return { valid: true };
}

export type OrganizationSecretSafe = Pick<OrganizationSecret, 'id' | 'name' | 'createdAt' | 'updatedAt'>;
function makeSecretResult(secret: OrganizationSecret): OrganizationSecretSafe {
  return {
    id: secret.id,
    name: secret.name,
    createdAt: secret.createdAt,
    updatedAt: secret.updatedAt,
  };
}

/** Creates a new organization secret */
export async function createSecret({
  organizationId,
  name,
  value,
}: {
  organizationId: string;
  name: string;
  value: string;
}): Promise<OrganizationSecretSafe> {
  let secret = await prisma.organizationSecret.create({
    data: {
      id: PakloId.generate('organization_secret'),
      organizationId,
      name,
    },
  });

  // create the secret in Azure Key Vault
  const url = await setKeyVaultSecret({ name: secret.id, value });

  // update the secret with the URL
  secret = await prisma.organizationSecret.update({
    where: { id: secret.id },
    data: { secretUrl: url },
  });

  return makeSecretResult(secret);
}

/** Updates an existing organization secret's value */
export async function updateSecret({
  organizationId,
  id,
  value,
}: {
  organizationId: string;
  id: string;
  value: string;
}): Promise<OrganizationSecretSafe> {
  let secret = await prisma.organizationSecret.findUniqueOrThrow({
    // organizationId just to make sure it matches the organization
    where: { organizationId, id },
  });

  // update the secret in Azure Key Vault
  let { secretUrl: url } = secret;
  if (url) {
    await setKeyVaultSecret({ url, value });
    // update the secret's updatedAt timestamp
    secret = await prisma.organizationSecret.update({
      // organizationId just to make sure it matches the organization
      where: { organizationId, id },
      data: { updatedAt: new Date() },
    });
  } else {
    // if no URL is set, create a new secret
    url = await setKeyVaultSecret({ name: secret.id, value });
    // update the secret with the new URL
    secret = await prisma.organizationSecret.update({
      // organizationId just to make sure it matches the organization
      where: { organizationId, id: secret.id },
      data: { secretUrl: url },
    });
  }

  return makeSecretResult(secret);
}

/** Deletes an existing organization secret */
export async function deleteSecret({ organizationId, id }: { organizationId: string; id: string }) {
  const secret = await prisma.organizationSecret.findUniqueOrThrow({
    // organizationId just to make sure it matches the organization
    where: { organizationId, id },
  });

  // delete the secret from Azure Key Vault
  const { secretUrl: url } = secret;
  if (url) {
    await deleteKeyVaultSecret({ url });
  }

  // delete the secret from the database
  await prisma.organizationSecret.delete({
    // organizationId just to make sure it matches the organization
    where: { organizationId, id },
  });
}

/**
 * Retrieves the value of an organization secret.
 * @note This should only be called server-side when triggering jobs.
 */
export async function getSecretValue({
  organizationId,
  name,
}: {
  organizationId: string;
  name: string;
}): Promise<string | undefined> {
  const secret = await prisma.organizationSecret.findUnique({
    where: { organizationId_name: { organizationId, name } },
  });
  if (!secret || !secret.secretUrl) return undefined;

  return getKeyVaultSecret({ url: secret.secretUrl });
}
