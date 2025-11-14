import { stripe } from '@better-auth/stripe';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
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
import { prisma as prismaClient } from '@/lib/prisma';
import { RegionCodeSchema } from '@/lib/regions';
import { stripe as stripeClient } from '@/lib/stripe';
import { config } from '@/site-config';
import app from '../../package.json';

export const auth = betterAuth({
  database: prismaAdapter(prismaClient, {
    provider: 'mongodb',
  }),
  appName: app.name,
  user: {
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 5 * 60, // 5 minutes
      async beforeDelete(user, request) {
        // block delete if user owns organizations
        const ownedOrgs = await prismaClient.organization.count({
          where: { members: { some: { userId: user.id, role: 'owner' } } },
        });
        if (ownedOrgs > 0) {
          throw new APIError('FORBIDDEN', {
            message:
              'Cannot delete account while owning organizations. Please transfer ownership or delete organizations first.',
          });
        }
      },
      async afterDelete(user, request) {
        // TODO: find out if we need to delete the customer in Stripe
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
            type: {
              type: ['azure', 'bitbucket', 'gitlab'],
              required: true,
              validator: { input: OrganizationTypeSchema },
            },
            url: { type: 'string', required: true, unique: true },
            region: { type: 'string', required: true, validator: { input: RegionCodeSchema } },
            maxProjects: { type: 'number', required: false, validator: { input: z.int().min(1).max(100).optional() } },
          },
        },
      },
      async sendInvitationEmail(data, request) {
        const acceptUrl = `${config.siteUrl}/invite/accept?id=${data.id}`;
        const declineUrl = `${config.siteUrl}/invite/decline?id=${data.id}`;
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
          logger.debug(`Sending inviter declined notice for ${invitation.email} to ${user.email}`);
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
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
    }),
    nextCookies(), // must be last to work with server actions/components
  ],
});

export type Session = typeof auth.$Infer.Session;
export type Organization = typeof auth.$Infer.Organization;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
export type Invitation = typeof auth.$Infer.Invitation;
export type Member = typeof auth.$Infer.Member;
export type { Passkey } from 'better-auth/plugins/passkey';
export type OrganizationRole = Member['role'];
export type AssignableOrganizationRole = Exclude<OrganizationRole, 'owner'>;
