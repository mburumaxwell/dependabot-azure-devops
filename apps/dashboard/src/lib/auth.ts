import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, magicLink, organization } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { sendMagicLinkEmail } from '@/emails';
import { PrismaClient } from '@/lib/prisma/client';
import app from '../../package.json';
import { logger } from './logger';

const client = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(client, {
    provider: 'postgresql',
  }),
  appName: app.name,
  plugins: [
    admin({
      // adminUserIds: [],
    }),
    organization(),
    passkey({ rpName: 'Paklo' }),
    magicLink({
      expiresIn: 5 * 60, // 5 minutes
      async sendMagicLink({ email, token, url }, request) {
        logger.debug(`Sending magic link to ${email} url: ${url}`);
        await sendMagicLinkEmail({ to: [email], token, url });
      },
    }),
    nextCookies(),
  ],
});
