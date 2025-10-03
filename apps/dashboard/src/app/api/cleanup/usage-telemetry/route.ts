import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Delete records older than 1 year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const result = await prisma.usageTelemetry.deleteMany({
    where: { started: { lt: oneYearAgo } },
  });

  logger.info(
    `Usage telemetry cleanup completed: deleted ${result.count} records older than ${oneYearAgo.toISOString()}`,
  );

  return new NextResponse(null, { status: 204 });
}
