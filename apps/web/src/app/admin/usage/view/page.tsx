import type { DependabotPackageManager } from '@paklo/core/dependabot';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getDateTimeRange, type TimeRange } from '@/lib/aggregation';
import { unwrapWithAll, type WithAll } from '@/lib/enums';
import { type Filter, getMongoCollection, type UsageTelemetry } from '@/lib/mongodb';
import { loggedIn } from '../actions';
import { type SlimTelemetry, TelemetryDashboard } from './part-dashboard';

export const metadata: Metadata = {
  title: 'Usage Statistics',
  description: 'View usage statistics',
  openGraph: { url: `/admin/usage/view` },
};

export default async function Page(props: PageProps<'/admin/usage/view'>) {
  const isLoggedIn = await loggedIn();
  if (!isLoggedIn) {
    redirect('/admin/usage');
  }

  const searchParams = (await props.searchParams) as {
    timeRange?: TimeRange;
    owner?: string;
    packageManager?: WithAll<DependabotPackageManager>;
    success?: WithAll<'true' | 'false'>;
  };
  const { timeRange = '24h', owner, packageManager: selectedPackageManager, success: successFilter } = searchParams;
  const { start, end } = getDateTimeRange(timeRange);

  const packageManager = unwrapWithAll(selectedPackageManager);
  const success = successFilter === 'true' ? true : successFilter === 'false' ? false : undefined;

  const collection = await getMongoCollection('usage_telemetry');
  const query: Filter<UsageTelemetry> = {
    started: { $gte: start, $lte: end },
    ...(owner ? { owner } : {}),
    ...(packageManager ? { packageManager } : {}),
    ...(success !== undefined ? { success: success } : {}),
  };
  const telemetries = await collection
    .find(query)
    .sort({ started: -1 })
    .project<SlimTelemetry>({
      _id: 1,
      owner: 1,
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
