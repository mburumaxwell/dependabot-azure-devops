import { PrismaClient } from '@/../.prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({});

export type {
  Account,
  Invitation,
  Member,
  Organization,
  OrganizationCredential,
  OrganizationSecret,
  OrganizationType,
  Passkey,
  Project,
  Repository,
  Session,
  SynchronizationStatus,
  UpdateJobTrigger,
  UsageTelemetry,
  User,
  Verification,
} from '@/../.prisma/client';

export { Prisma, PrismaClient } from '@/../.prisma/client';

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma;
