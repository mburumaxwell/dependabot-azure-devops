import { PrismaClient } from '@/../.generated/prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({});

export type {
  Feedback,
  Organization,
  OrganizationCredential,
  OrganizationSecret,
  Project,
  Repository,
  RepositoryPullRequest,
  RepositoryUpdate,
  UpdateJob,
  UpdateJobSecret,
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
