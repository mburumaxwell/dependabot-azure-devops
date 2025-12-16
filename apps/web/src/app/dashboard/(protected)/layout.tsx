import type { Metadata } from 'next';
import type { TemplateString } from 'next/dist/lib/metadata/types/metadata-types';
import { headers as requestHeaders } from 'next/headers';
import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/theme';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { auth, isPakloAdmin } from '@/lib/auth';
import { config } from '@/site-config';

const titleTemplate: TemplateString = {
  default: config.dashboard.title,
  template: `%s | ${config.dashboard.title}`,
};

export const metadata: Metadata = {
  title: titleTemplate,
  description: config.description,
  metadataBase: new URL(config.siteUrl),
  openGraph: {
    type: 'website',
    title: titleTemplate,
    description: config.description,
    url: config.siteUrl,
  },
};

export default async function Layout({ children }: LayoutProps<'/'>) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizations = await auth.api.listOrganizations({ headers });
  const pakloAdmin = isPakloAdmin(session);

  return (
    <SidebarProvider>
      <AppSidebar session={session} organizations={organizations} pakloAdmin={pakloAdmin} />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
          <AppBreadcrumb />
          <div className='ml-auto'>
            <ThemeToggle />
            {/* <ThemeToggleButton /> */}
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
