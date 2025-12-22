import { passkey } from '@better-auth/passkey';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { betterAuth } from 'better-auth/minimal';
import { nextCookies } from 'better-auth/next-js';
import { admin, lastLoginMethod, magicLink, organization } from 'better-auth/plugins';
import {
  sendMagicLinkEmail,
  sendOrganizationInviteDeclinedEmail,
  sendOrganizationInviteEmail,
  sendUserDeleteVerificationEmail,
} from '@/emails';
import { environment } from '@/lib/environment';
import { PakloId } from '@/lib/ids';
import { logger } from '@/lib/logger';
import { OrganizationTypeSchema } from '@/lib/organizations';
import { prisma as prismaClient } from '@/lib/prisma';
import { RegionCodeSchema } from '@/lib/regions';
import { config } from '@/site-config';
import app from '../../package.json';

const adminUserIds = process.env.AUTH_ADMIN_USER_IDS?.split(',') ?? [];
const adminEmails = process.env.AUTH_ADMIN_EMAILS?.split(',') ?? [];

export const auth = betterAuth({
  database: prismaAdapter(prismaClient, { provider: 'mongodb' }),
  appName: app.name,
  advanced: {
    database: {
      generateId: ({ model, size }) =>
        PakloId.isValidType(model) ? PakloId.generate(model) : PakloId.generateKidOnly(),
    },
    // since we have not set baseURL, we need to trust proxy headers on ACA
    trustedProxyHeaders: environment.platform === 'azure_container_apps',
  },
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
      async sendDeleteAccountVerification({ user, url }, request) {
        logger.debug(`Sending account deletion verification to ${user.email} url: ${url}`);
        await sendUserDeleteVerificationEmail({ recipient: user.email, url });
      },
    },
  },
  plugins: [
    admin({ adminUserIds }),
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
            providerHostname: { type: 'string', required: true },
            providerApiEndpoint: { type: 'string', required: true },
            customerId: { type: 'string', required: false, input: false },
            subscriptionId: { type: 'string', required: false, input: false },
            subscriptionStatus: { type: 'string', required: false, input: false },
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
      async sendMagicLink({ email, url }, ctx) {
        logger.debug(`Sending magic link to ${email} url: ${url}`);
        await sendMagicLinkEmail({ recipient: email, url });
      },
    }),
    lastLoginMethod(),
    nextCookies(), // must be last to work with server actions/components
  ],
});

export type Session = typeof auth.$Infer.Session;
export type Organization = typeof auth.$Infer.Organization;
export type Invitation = typeof auth.$Infer.Invitation;
export type Member = typeof auth.$Infer.Member;
export type MemberRole = Member['role'];
export type { Passkey } from '@better-auth/passkey';

export { APIError as BetterAuthApiError };
export { toNextJsHandler } from 'better-auth/next-js';

export function isPakloAdmin(session: Session) {
  return (
    session.user.role === 'admin' ||
    adminUserIds.includes(session.user.id) ||
    // also allow by email for flexibility
    adminEmails.includes(session.user.email)
  );
}
