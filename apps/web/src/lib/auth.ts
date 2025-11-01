import { checkout, polar, portal, usage, webhooks } from '@polar-sh/better-auth';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, magicLink, organization } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { z } from 'zod/v4';
import {
  sendMagicLinkEmail,
  sendOrganizationInviteDeclinedEmail,
  sendOrganizationInviteEmail,
  sendUserDeleteVerificationEmail,
} from '@/emails';
import { logger } from '@/lib/logger';
import { OrganizationTypeSchema } from '@/lib/organization-types';
import { polar as polarClient } from '@/lib/polar';
import { prisma as prismaClient } from '@/lib/prisma';
import { RegionCodeSchema } from '@/lib/regions';
import { config } from '@/site-config';
import app from '../../package.json';

export const auth = betterAuth({
  database: prismaAdapter(prismaClient, {
    provider: 'postgresql',
  }),
  appName: app.name,
  user: {
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 5 * 60, // 5 minutes
      async afterDelete(user, request) {
        // does not happen automatically, so we need to delete the customer in Polar
        logger.debug(`Deleting Polar customer for user ${user.id}`);
        await polarClient.customers.deleteExternal({
          externalId: user.id,
        });
      },
      async sendDeleteAccountVerification({ user, url }, request) {
        logger.debug(`Sending account deletion verification to ${user.email} url: ${url}`);
        await sendUserDeleteVerificationEmail({ recipient: user.email, url });
      },
    },
  },
  plugins: [
    admin({ adminUserIds: process.env.ADMIN_USER_IDS?.split(',') ?? [] }),
    organization({
      schema: {
        organization: {
          additionalFields: {
            type: { type: 'string', required: true, validator: { input: OrganizationTypeSchema } },
            url: { type: 'string', required: true, unique: true },
            region: { type: 'string', required: true, validator: { input: RegionCodeSchema } },
            maxProjects: { type: 'number', required: false, validator: { input: z.int().min(1).max(100).optional() } },
            token: { type: 'string', required: true, returned: false },
            githubToken: { type: 'string', required: false, returned: false },
          },
        },
      },
      async sendInvitationEmail(data, request) {
        const acceptUrl = `${config.siteUrl}/dashboard/organization/invite/accept?id=${data.id}`;
        const declineUrl = `${config.siteUrl}/dashboard/organization/invite/decline?id=${data.id}`;
        logger.debug(`Sending invitation to ${data.invitation.email} url: ${acceptUrl}`);
        await sendOrganizationInviteEmail({
          organization: data.organization.name,
          recipient: data.invitation.email,
          inviter: data.inviter.user.name,
          acceptUrl,
          declineUrl,
          expires: data.invitation.expiresAt,
        });
      },
      organizationHooks: {
        async afterDeleteOrganization({ organization, user }) {
          // TODO: cancel subscription
        },
        async afterRejectInvitation({ invitation, user, organization }) {
          // notify inviter of rejection
          logger.debug(`Sending invitation declined notice for ${invitation.email} to ${user.email}`);
          await sendOrganizationInviteDeclinedEmail({
            organization: organization.name,
            invitee: invitation.email,
            recipient: user.email,
          });
        },
      },
    }),
    passkey({ rpName: 'Paklo' }),
    magicLink({
      expiresIn: 5 * 60, // 5 minutes
      async sendMagicLink({ email, url }, request) {
        logger.debug(`Sending magic link to ${email} url: ${url}`);
        await sendMagicLinkEmail({ recipient: email, url });
      },
    }),
    nextCookies(),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            { productId: process.env.POLAR_PRODUCT_ID_PROJECT!, slug: 'project' },
            // { productId: process.env.POLAR_PRODUCT_ID_MINUTES, slug: 'minutes' },
          ],
          authenticatedUsersOnly: true,
          successUrl: `${config.siteUrl}/settings/billing?checkout=success`,
          returnUrl: `${config.siteUrl}/settings/billing`,
        }),
        portal({ returnUrl: `${config.siteUrl}/settings/billing` }),
        usage(),
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
