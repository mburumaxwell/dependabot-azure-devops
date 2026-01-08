import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/../.generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

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

if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma;
