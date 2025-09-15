import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin, magicLink, organization } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';
import { sendMagicLinkEmail } from '@/emails';
import { PrismaClient } from '@/lib/prisma/client';
import app from '../../package.json';

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
      async sendMagicLink({ email, token, url }, request) {
        await sendMagicLinkEmail({ to: [email], token, url });
      },
    }),
    nextCookies(),
  ],
});
