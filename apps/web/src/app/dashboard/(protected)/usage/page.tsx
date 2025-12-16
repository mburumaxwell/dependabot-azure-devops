import type { DependabotPackageManager } from '@paklo/core/dependabot';
import type { Metadata } from 'next';
import { headers as requestHeaders } from 'next/headers';
import { forbidden } from 'next/navigation';
import { getDateFromTimeRange, type TimeRange } from '@/lib/aggregation';
import { auth, isPakloAdmin } from '@/lib/auth';
import { unwrapWithAll, type WithAll } from '@/lib/enums';
import { type Filter, getMongoCollection, type UsageTelemetry } from '@/lib/mongodb';
import { type SlimTelemetry, TelemetryDashboard } from './page.client';

export const metadata: Metadata = {
  title: 'Usage Statistics',
  description: 'View usage statistics',
  openGraph: { url: `/dashboard/usage` },
};

export default async function Page(props: PageProps<'/dashboard/usage'>) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  if (!isPakloAdmin(session)) {
    forbidden();
  }

  const searchParams = (await props.searchParams) as {
    timeRange?: TimeRange;
    packageManager?: WithAll<DependabotPackageManager>;
    success?: WithAll<'true' | 'false'>;
  };
  const { timeRange = '24h', packageManager: selectedPackageManager, success: successFilter } = searchParams;
  const { start, end } = getDateFromTimeRange(timeRange);

  const packageManager = unwrapWithAll(selectedPackageManager);
  const success = successFilter === 'true' ? true : successFilter === 'false' ? false : undefined;

  const collection = await getMongoCollection('usage_telemetry', process.env.MONGO_DB_NAME_LOCAL);
  const query: Filter<UsageTelemetry> = {
    started: { $gte: start, $lte: end },
    ...(packageManager ? { packageManager } : {}),
    ...(success !== undefined ? { success: success } : {}),
  };
  const telemetries = await collection
    .find(query)
    .sort({ started: -1 })
    .project<SlimTelemetry>({
      _id: 1,
      packageManager: 1,
      started: 1,
      success: 1,
      duration: 1,
      version: 1,
    })
    .toArray();

  return (
    <div className='min-h-screen bg-background'>
      <TelemetryDashboard telemetries={telemetries} />
    </div>
  );
}
