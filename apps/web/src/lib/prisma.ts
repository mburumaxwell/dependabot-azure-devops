import { PrismaClient } from '@/../.prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({});

export type {
  Account,
  Feedback,
  FeedbackAction,
  Invitation,
  Member,
  Organization,
  OrganizationBillingInterval,
  OrganizationCredential,
  OrganizationSecret,
  OrganizationType,
  Passkey,
  Project,
  Repository,
  RepositoryUpdate,
  Session,
  SubscriptionStatus,
  SynchronizationStatus,
  UpdateJob,
  UpdateJobSecret,
  UpdateJobStatus,
  UpdateJobTrigger,
  User,
  Verification,
} from '@/../.prisma/client';

export { Prisma, PrismaClient } from '@/../.prisma/client';

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma;
