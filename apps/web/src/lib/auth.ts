import { environment } from '@paklo/core/environment';
import { polar, webhooks } from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, magicLink, organization } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { sendMagicLinkEmail } from '@/emails';
import { PrismaClient } from '@/lib/prisma/client';
import app from '../../package.json';
import { logger } from './logger';
import { OrganizationTypeSchema } from './organization-types';
import { RegionCodeSchema } from './regions';

const prismaClient = new PrismaClient();
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Remember that all objects are completely separated between environments.
  server: environment.production ? 'production' : 'sandbox',
});

export const auth = betterAuth({
  database: prismaAdapter(prismaClient, {
    provider: 'postgresql',
  }),
  appName: app.name,
  user: {
    deleteUser: {
      enabled: true,
      async beforeDelete(user) {
        // Perform any cleanup or additional checks here
      },
      async afterDelete(user, request) {
        // Perform any cleanup or additional actions here
      },
      async sendDeleteAccountVerification({ user, token, url }, request) {
        logger.debug(`Sending account deletion verification to ${user.email} url: ${url}`);
        // TODO: implement this email
        // await sendDeleteVerificationEmail({ to: [user.email], token, url });
      },
    },
  },
  plugins: [
    admin({
      // TODO: populate this
      // adminUserIds: [],
    }),
    organization({
      schema: {
        organization: {
          additionalFields: {
            type: { type: 'string', required: true, validator: { input: OrganizationTypeSchema } },
            url: { type: 'string', required: true, unique: true },
            token: { type: 'string', required: true },
            region: { type: 'string', required: true, validator: { input: RegionCodeSchema } },
          },
        },
      },
    }),
    passkey({ rpName: 'Paklo' }),
    magicLink({
      expiresIn: 5 * 60, // 5 minutes
      async sendMagicLink({ email, token, url }, request) {
        logger.debug(`Sending magic link to ${email} url: ${url}`);
        await sendMagicLinkEmail({ to: [email], token, url });
      },
    }),
    nextCookies(),
    polar({
      client: polarClient,
      createCustomerOnSignUp: false, // customers are created from organizations
      use: [
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          // TODO: handle webhooks here
        }),
      ],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type Organization = typeof auth.$Infer.Organization;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
export type Invitation = typeof auth.$Infer.Invitation;
export type Member = typeof auth.$Infer.Member;
export type { Passkey } from 'better-auth/plugins/passkey';
