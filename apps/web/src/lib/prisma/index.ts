import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// biome-ignore lint/suspicious/noRedeclare: following template/docs
export const prisma = global.prisma || new PrismaClient({});

if (process.env.NODE_ENV === 'development') global.prisma = prisma;
