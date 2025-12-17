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
  OrganizationCredential,
  OrganizationSecret,
  OrganizationType,
  Passkey,
  Project,
  Repository,
  RepositoryPullRequest,
  RepositoryPullRequestStatus,
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

export type {
  InputJsonArray,
  InputJsonObject,
  InputJsonValue,
  JsonArray,
  JsonObject,
  JsonValue,
} from '@/../.prisma/runtime/library';

export type DependabotPersistedDep = {
  name: string;
  version?: string;
};

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma;
