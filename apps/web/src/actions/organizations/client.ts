'use server';

import {
  AzureDevOpsClient,
  AzureDevOpsClientWrapper,
  type AzureDevOpsOrganizationUrl,
  extractOrganizationUrl,
} from '@paklo/core/azure';
import { type Organization, type OrganizationCredential, prisma } from '@/lib/prisma';

type CreateAzdoClientOptions =
  | {
      url: AzureDevOpsOrganizationUrl;
      token: string;
    }
  | {
      organization: Pick<Organization, 'id' | 'url'>;
      credential: Pick<OrganizationCredential, 'token'>;
    }
  | {
      organization: Pick<Organization, 'id' | 'url'>;
    }
  | {
      id: string;
    };

export async function createAzdoClient<W extends boolean = false>(
  options: CreateAzdoClientOptions,
  wrapper?: W,
): Promise<W extends true ? AzureDevOpsClientWrapper : AzureDevOpsClient> {
  let url: AzureDevOpsOrganizationUrl;
  let token: string;

  if ('id' in options || 'organization' in options) {
    let organization: Pick<Organization, 'id' | 'url'>;
    let credential: Pick<OrganizationCredential, 'token'>;
    if ('id' in options) {
      const id = options.id;
      organization = await prisma.organization.findUniqueOrThrow({ where: { id } });
      credential = await prisma.organizationCredential.findUniqueOrThrow({ where: { id } });
    } else {
      organization = options.organization;
      if ('credential' in options) {
        credential = options.credential;
      } else {
        const credentialRecord = await prisma.organizationCredential.findUniqueOrThrow({
          where: { id: organization.id },
        });
        credential = credentialRecord;
      }
    }
    url = extractOrganizationUrl({ organisationUrl: organization.url });
    token = credential.token;
  } else {
    url = options.url;
    token = options.token;
  }

  const client = wrapper ? new AzureDevOpsClientWrapper(url, token) : new AzureDevOpsClient(url, token);
  return client as W extends true ? AzureDevOpsClientWrapper : AzureDevOpsClient;
}
