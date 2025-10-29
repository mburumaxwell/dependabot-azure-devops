import { zValidator } from '@hono/zod-validator';
import {
  ANONYMOUS_USER_ID,
  type AzureDevOpsOrganizationUrl,
  AzureDevOpsWebApiClient,
  extractOrganizationUrl,
} from '@paklo/core/azure';
import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { z } from 'zod/v4';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const RequestBodySchema = z.object({
  type: z.enum(['azure', 'bitbucket']),
  url: z.url(),
  token: z.string().min(1),
});
const app = new Hono().basePath('/api/organizations/validate-creds');

app.post('/', zValidator('json', RequestBodySchema), async (context) => {
  const { url: inputUrl, token } = context.req.valid('json');

  // ensure the URL can be parsed
  let url: AzureDevOpsOrganizationUrl;
  try {
    url = extractOrganizationUrl({ organisationUrl: inputUrl });
  } catch (_error) {
    return context.json({ valid: false, message: 'Invalid URL format' }, 200);
  }

  // ensure the token is valid and is not anonymous
  let userId: string;
  const client = new AzureDevOpsWebApiClient(url, token);
  try {
    userId = await client.getUserId();

    if (!userId || userId === ANONYMOUS_USER_ID) {
      return context.json({ valid: false, message: 'Invalid credentials provided' }, 200);
    }
  } catch (_error) {
    const message = 'Failed to connect to Azure DevOps with provided credentials. Please check your URL.';
    return context.json({ valid: false, message }, 200);
  }

  // TODO: check for other permissions here so that we ensure it will keep working

  // ensure there is not other organization with the same URL
  const existingOrg = await prisma.organization.findFirst({ where: { url: inputUrl } });
  if (existingOrg) {
    return context.json({ valid: false, message: 'An organization with the provided URL already exists' }, 400);
  }

  return context.json({ valid: true }, 200);
});

export const POST = handle(app);
