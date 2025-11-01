'use client';

import { BadgeCheck, ChevronsUpDown, LogOut, Plus } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { authClient, type Organization, type Session } from '@/lib/auth-client';
import { getOrganizationInfo } from '@/lib/organization-types';
import { cn } from '@/lib/utils';

type MenuItem = { label: string; href: Route };
type MenuGroup = { label: string; href: Route; items?: MenuItem[] };

const groups: MenuGroup[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    items: [
      // TODO: remove "as Route" once these routes have been created
      { label: 'Activity', href: '/dashboard/activity' as Route },
      { label: 'Projects', href: '/dashboard/projects' as Route },
      { label: 'Repositories', href: '/dashboard/repos' as Route },
      { label: 'Runs', href: '/dashboard/runs' as Route },
      { label: 'Private Vulnerabilities', href: '/dashboard/private-vulns' as Route },
    ],
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    items: [
      { label: 'Usage', href: '/dashboard/settings/usage' },
      { label: 'Team', href: '/dashboard/settings/team' },
      { label: 'Billing', href: '/dashboard/settings/billing' },
      { label: 'Integrations', href: '/dashboard/settings/integrations' },
    ],
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session;
  organizations: Organization[];
}
export function AppSidebar({ session: rawSession, organizations: rawOrganizations, ...props }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (href: Route) => pathname === href || (href !== '/' && pathname.startsWith(href));
  const { isMobile } = useSidebar();
  const [organizations] = useState(rawOrganizations);
  const [session] = useState(rawSession);

  function handleLogout(): void {
    authClient.signOut({
      fetchOptions: {
        // redirect to login page
        onSuccess: () => router.push('/login'),
      },
    });
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <OrganizationSwitcher
          isMobile={isMobile}
          organizations={organizations}
          activeOrganizationId={session.session.activeOrganizationId}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {groups.map((group) => (
              <SidebarMenuItem key={group.label}>
                <SidebarMenuButton asChild isActive={isActive(group.href)}>
                  <Link href={group.href} className='font-medium'>
                    {group.label}
                  </Link>
                </SidebarMenuButton>
                {group.items?.length ? (
                  <SidebarMenuSub key={group.label}>
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.label}>
                        <SidebarMenuSubButton asChild isActive={isActive(item.href)}>
                          <Link href={item.href}>{item.label}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <UserAvatarSnippet session={session} />
                  <ChevronsUpDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side={isMobile ? 'bottom' : 'right'}
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                    <UserAvatarSnippet session={session} />
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/account')}>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function getInitials(value: string, type: 'all' | 'first' = 'all') {
  return value
    .split(/[\s@]+/)
    .slice(0, type === 'first' ? 1 : 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function UserAvatarSnippet({ session }: Pick<AppSidebarProps, 'session'>) {
  if (!session || !session.user) return null;

  const user = session.user;
  return <AvatarSnippet title={user.name} subtitle={user.email} image={user.image} />;
}

type AvatarSnippetProps = {
  title: string;
  subtitle?: string;
  image?: string | null;
  initialType?: 'all' | 'first';
};

function AvatarSnippet(props: AvatarSnippetProps) {
  return (
    <>
      <AvatarSnippetHeader size={8} {...props} />
      <AvatarSnippetFooter {...props} />
    </>
  );
}

function AvatarSnippetHeader({
  title,
  subtitle,
  image,
  size,
  className,
  initialType = 'all',
  ...props
}: AvatarSnippetProps & { size: 4 | 8 } & React.ComponentProps<typeof Avatar>) {
  const initials = getInitials(title || subtitle || 'Paklo', initialType);

  return (
    // we override anything present because of size
    <Avatar className={cn(className, `size-${size} rounded-lg`)} {...props}>
      <AvatarImage src={image!} alt={title} />
      <AvatarFallback className={`rounded-lg size-${size}`}>{initials}</AvatarFallback>
    </Avatar>
  );
}

function AvatarSnippetFooter({ title, subtitle }: AvatarSnippetProps) {
  return (
    <div className='grid flex-1 text-left text-sm leading-tight'>
      <span className='truncate font-medium'>{title}</span>
      {subtitle && <span className='truncate text-xs'>{subtitle}</span>}
    </div>
  );
}

function OrganizationSwitcher({
  isMobile,
  organizations,
  activeOrganizationId,
}: { isMobile: boolean; activeOrganizationId?: string | null } & Pick<AppSidebarProps, 'organizations'>) {
  const router = useRouter();
  const activeOrg = organizations.find((org) => org.id === activeOrganizationId)!;

  async function handleOrgChange(organization: Organization) {
    const response = await authClient.organization.setActive({ organizationId: organization.id });
    if (response.error) {
      toast.error('Failed to switch organization', {
        description: response.error.message,
      });
      return;
    }

    // reload to reflect changes
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg'>
                <AvatarSnippetHeader
                  title={activeOrg?.name || 'Organization'}
                  subtitle={getOrganizationInfo(activeOrg?.type)?.name}
                  image={activeOrg?.logo}
                  size={8}
                />
              </div>
              <AvatarSnippetFooter
                title={activeOrg?.name || 'Organization'}
                subtitle={getOrganizationInfo(activeOrg?.type)?.name}
              />
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>Organizations</DropdownMenuLabel>
            {organizations.map((organization) => (
              <DropdownMenuItem
                key={organization.name}
                onClick={() => handleOrgChange(organization)}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-md border'>
                  <AvatarSnippetHeader
                    title={organization.name}
                    subtitle={getOrganizationInfo(organization.type)?.name}
                    image={organization.logo}
                    size={4}
                    className='shrink-0'
                    initialType='first'
                  />
                </div>
                {organization.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-2 p-2' onClick={() => router.push('/dashboard/organization/create')}>
              <div className='flex size-6 items-center justify-center rounded-md border bg-transparent'>
                <Plus className='size-4' />
              </div>
              <div className='text-muted-foreground font-medium'>Add organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
