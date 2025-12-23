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

export function AppBreadcrumb({ omit }: { omit?: string[] }) {
  const pathname = usePathname();

  function getBreadcrumbs() {
    const paths = pathname.split('/').filter(Boolean);
    paths.shift(); // remove 'dashboard' from the beginning
    const breadcrumbs: { label: string; href: string; isLast: boolean }[] = [];

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]!;
      const href = `/${paths.slice(0, i + 1).join('/')}`;

      // skip omitted paths
      if (omit?.includes(path)) continue;

      // skip numeric IDs and PakloIds
      if (Number.isNaN(path) || PakloId.isValid(path)) continue;

      // format the breadcrumb label
      let label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // handle special cases
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
          <BreadcrumbLink href={breadcrumbs.length ? '/dashboard' : undefined}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb) => (
          <div key={crumb.href} className='flex items-center gap-2'>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/dashboard${crumb.href}`}>{crumb.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
