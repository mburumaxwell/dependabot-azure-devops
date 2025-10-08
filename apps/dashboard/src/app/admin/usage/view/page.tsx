import { redirect } from 'next/navigation';
import { getDateTimeRange, type TimeRange } from '@/lib/aggregation';
import { loggedIn } from '../actions';
import { fetchTelemetryData } from './actions';
import { TelemetryDashboard } from './part-dashboard';

export default async function Page(props: PageProps<'/admin/usage/view'>) {
  const isLoggedIn = await loggedIn();
  if (!isLoggedIn) {
    redirect('/admin/usage');
  }

  const searchParams = (await props.searchParams) as {
    timeRange?: TimeRange;
    owner?: string;
    packageManager?: string;
    success?: string;
  };
  const { timeRange = '24h', owner, packageManager, success } = searchParams;
  const { start, end } = getDateTimeRange(timeRange);

  const data = await fetchTelemetryData({
    start,
    end,
    owner,
    packageManager,
    success,
  });

  return (
    <div className='min-h-screen bg-background'>
      <TelemetryDashboard initialData={data} />
    </div>
  );
}
