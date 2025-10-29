import { headers as requestHeaders } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumb, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';

export default async function Layout({ children }: LayoutProps<'/'>) {
  const headers = await requestHeaders();
  const session = (await auth.api.getSession({ headers }))!;
  const organizations = await auth.api.listOrganizations({ headers });

  return (
    <SidebarProvider>
      <AppSidebar session={session} organizations={organizations} />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              {/* TODO: figure out how to implement breadcrumbs */}
              {/* <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Building Your Application
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem> */}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
