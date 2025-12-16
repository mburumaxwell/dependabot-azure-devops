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

export function AppBreadcrumb() {
  const pathname = usePathname();

  function getBreadcrumbs() {
    const paths = pathname.split('/').filter(Boolean);
    paths.shift(); // remove 'dashboard' from the beginning
    const breadcrumbs: { label: string; href: string; isLast: boolean }[] = [];

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]!;
      const href = `/${paths.slice(0, i + 1).join('/')}`;

      // Skip numeric IDs and certain paths
      if (!Number.isNaN(path)) continue;

      // Format the breadcrumb label
      let label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      //   // Handle special cases
      //   if (path === "tools") label = "Tools"
      if (path === 'clients') label = 'Clients';
      //   if (path === "jobs") label = "Jobs"
      //   if (path === "settings") label = "Settings"
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
