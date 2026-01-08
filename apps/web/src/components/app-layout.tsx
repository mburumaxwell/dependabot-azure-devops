import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeSelect } from '@/components/theme';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { Organization, Session } from '@/lib/auth';

export { dashboardMetadata as metadata } from '@/lib/metadata';

type AppLayoutProps = {
  children: React.ReactNode;
  session?: Session;
  organizations?: (Pick<Organization, 'id' | 'name' | 'slug' | 'type' | 'logo'> & { active: boolean })[];
  pakloAdmin?: boolean;
  breadcrumb?: boolean;
};

export async function AppLayout({
  children,
  session,
  organizations = [],
  pakloAdmin = false,
  breadcrumb = true,
}: AppLayoutProps) {
  const slugs = organizations.map((org) => org.slug);

  return (
    <SidebarProvider>
      {session && <AppSidebar session={session} organizations={organizations} pakloAdmin={pakloAdmin} />}
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <div>
            <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
          </div>
          {breadcrumb && <AppBreadcrumb omit={slugs} />}
          <div className='ml-auto'>
            <ThemeSelect />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
