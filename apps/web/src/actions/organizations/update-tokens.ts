'use server';

import { prisma } from '@/lib/prisma';

export async function updateOrganizationToken({
  id,
  token,
}: {
  id: string;
  token: string;
}): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    await prisma.organizationCredential.update({
      where: { id },
      data: { token },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}

export async function updateGithubToken({
  id,
  token,
}: {
  id: string;
  token: string;
}): Promise<{ success: boolean; error?: { message: string } }> {
  try {
    await prisma.organizationCredential.update({
      where: { id },
      data: { githubToken: token },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: (error as Error).message } };
  }
}
