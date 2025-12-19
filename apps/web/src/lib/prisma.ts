import { PrismaClient } from '@/../.prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({});

export type {
  Feedback,
  FeedbackAction,
  Organization,
  OrganizationCredential,
  OrganizationSecret,
  OrganizationType,
  Project,
  Repository,
  RepositoryPullRequest,
  RepositoryPullRequestStatus,
  RepositoryUpdate,
  SubscriptionStatus,
  SynchronizationStatus,
  UpdateJob,
  UpdateJobSecret,
  UpdateJobStatus,
  UpdateJobTrigger,
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

export type DependabotPersistedDep = PrismaJson.DependabotPersistedDep;

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma;
