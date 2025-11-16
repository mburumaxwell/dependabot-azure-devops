'use server';

import { PakloId } from '@/lib/paklo-id';
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

export type OrganizationSecretSafe = Pick<OrganizationSecret, 'id' | 'name' | 'updatedAt'>;
function makeSecretResult(secret: OrganizationSecret): OrganizationSecretSafe {
  return {
    id: secret.id,
    name: secret.name,
    updatedAt: secret.updatedAt,
  };
}

export async function createSecret({
  organizationId,
  name,
  value,
}: {
  organizationId: string;
  name: string;
  value: string;
}): Promise<OrganizationSecretSafe> {
  const secret = await prisma.organizationSecret.create({
    data: {
      id: PakloId.generate('organization_secret'),
      organizationId,
      name,
      value,
    },
  });

  return makeSecretResult(secret);
}

export async function updateSecret({
  organizationId,
  id,
  value,
}: {
  organizationId: string;
  id: string;
  value: string;
}): Promise<OrganizationSecretSafe> {
  const secret = await prisma.organizationSecret.update({
    where: {
      organizationId, // just to make sure it matches the organization
      id,
    },
    data: { value },
  });

  return makeSecretResult(secret);
}

export async function deleteSecret({ organizationId, id }: { organizationId: string; id: string }) {
  // Delete the secret from the database
  await prisma.organizationSecret.delete({
    where: {
      organizationId, // just to make sure it matches the organization
      id,
    },
  });
}
