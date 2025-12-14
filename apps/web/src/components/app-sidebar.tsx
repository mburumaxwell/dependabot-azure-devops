'use client';

import {
  Activity,
  BadgeCheck,
  Blocks,
  ChevronsUpDown,
  CircleGauge,
  CreditCard,
  Folder,
  Key,
  LogOut,
  type LucideIcon,
  Plus,
  Users,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { authClient, type Organization, type Session } from '@/lib/auth-client';
import { getOrganizationTypeInfo } from '@/lib/organizations';
import { cn, getInitials, type InitialsType } from '@/lib/utils';

type MenuItem = { label: string; href: Route; icon?: LucideIcon };
type MenuGroup = { label: string; items?: MenuItem[] };

const groups: MenuGroup[] = [
  {
    label: 'Home',
    items: [
      { label: 'Dashboard', href: '/dashboard/activity', icon: CircleGauge },
      { label: 'Projects', href: '/dashboard/projects', icon: Folder },
      { label: 'Runs', href: '/dashboard/runs', icon: Activity },
      // { label: 'Advisories', href: '/dashboard/advisories', icon: ShieldAlert },
      { label: 'Secrets', href: '/dashboard/secrets', icon: Key },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Team', href: '/dashboard/settings/team', icon: Users },
      { label: 'Billing', href: '/dashboard/settings/billing', icon: CreditCard },
      { label: 'Integrations', href: '/dashboard/settings/integrations', icon: Blocks },
    ],
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session;
  organizations: Organization[];
}
export function AppSidebar({ session, organizations, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: Route) => pathname === href;
  const { isMobile } = useSidebar();

  async function handleLogout() {
    const { data, error } = await authClient.signOut();
    if (!data?.success || error) {
      toast.error('Failed to log out', {
        description: error?.message || 'Please try again later.',
      });
      return;
    }

    // redirect to login page
    router.push('/login');
  }

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='border-b'>
        <OrganizationSwitcher
          isMobile={isMobile}
          organizations={organizations}
          activeOrganizationId={session.session.activeOrganizationId}
        />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupContent>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items?.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton tooltip={item.label} isActive={isActive(item.href)} asChild>
                      <Link href={item.href}>
                        {item.icon && <item.icon />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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

function UserAvatarSnippet({ session }: Pick<AppSidebarProps, 'session'>) {
  if (!session || !session.user) return null;

  const user = session.user;
  return <AvatarSnippet title={user.name} subtitle={user.email} image={user.image} />;
}

type AvatarSnippetProps = {
  title: string;
  subtitle?: string;
  image?: string | null;
  initialsType?: InitialsType;
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
  initialsType = 'all',
  ...props
}: AvatarSnippetProps & { size: 4 | 8 } & React.ComponentProps<typeof Avatar>) {
  const initials = getInitials(title || subtitle || 'Paklo', initialsType);

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
    const { error } = await authClient.organization.setActive({ organizationId: organization.id });
    if (error) {
      toast.error('Failed to switch organization', {
        description: error.message,
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
                  subtitle={getOrganizationTypeInfo(activeOrg?.type)?.name}
                  image={activeOrg?.logo}
                  size={8}
                />
              </div>
              <AvatarSnippetFooter
                title={activeOrg?.name || 'Organization'}
                subtitle={getOrganizationTypeInfo(activeOrg?.type)?.name}
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
                    subtitle={getOrganizationTypeInfo(organization.type).name}
                    image={organization.logo}
                    size={4}
                    className='shrink-0'
                    initialsType='first'
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
