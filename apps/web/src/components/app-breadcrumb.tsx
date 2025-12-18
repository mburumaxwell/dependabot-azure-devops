'use client';

import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { PakloId } from '@/lib/ids';

export function AppBreadcrumb() {
  const pathname = usePathname();

  function getBreadcrumbs() {
    const paths = pathname.split('/').filter(Boolean);
    paths.shift(); // remove 'dashboard' from the beginning
    const breadcrumbs: { label: string; href: string; isLast: boolean }[] = [];

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]!;
      const href = `/${paths.slice(0, i + 1).join('/')}`;

      // Skip numeric IDs and PakloIds
      if (Number.isNaN(path) || PakloId.isValid(path)) continue;

      // Format the breadcrumb label
      let label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Handle special cases
      if (path === 'account') label = 'Account';
      if (path === 'activity') label = 'Activity';
      if (path === 'advisories') label = 'Advisories';
      if (path === 'projects') label = 'Projects';
      if (path === 'connect') label = 'Connect';
      if (path === 'repos') label = 'Repos';
      if (path === 'updates') label = 'Updates';
      if (path === 'jobs') label = 'Jobs';
      if (path === 'runs') label = 'Runs';
      if (path === 'secrets') label = 'Secrets';
      if (path === 'settings') label = 'Settings';
      if (path === 'usage') label = 'Usage Telemetry';
      breadcrumbs.push({ label, href, isLast: i === paths.length - 1 });
    }

    return breadcrumbs;
  }
  const breadcrumbs = getBreadcrumbs();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb) => (
          <div key={crumb.href} className='flex items-center gap-2'>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
