import { PrismaClient } from '@/../.generated/prisma/client';

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
} from '@/../.generated/prisma/client';

export { Prisma, PrismaClient } from '@/../.generated/prisma/client';

export type {
  InputJsonArray,
  InputJsonObject,
  InputJsonValue,
  JsonArray,
  JsonObject,
  JsonValue,
} from '@/../.generated/prisma/runtime/library';

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma;
