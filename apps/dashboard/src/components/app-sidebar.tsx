'use client';

import { BadgeCheck, ChevronsUpDown, LogOut, Plus } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { type AuthClient, createAuthClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type { SiteConfig } from '@/site-config';

type MenuItem = { label: string; href: Route };
type MenuGroup = { label: string; items: MenuItem[] };

const groups: MenuGroup[] = [
  {
    label: 'Main',
    items: [
      { label: 'Repositories', href: '/repos' as Route },
      { label: 'Jobs', href: '/jobs' as Route },
      { label: 'Users', href: '/users' as Route },
      { label: 'Settings', href: '/settings' as Route },
    ],
  },
];

export function AppSidebar({ config, ...props }: React.ComponentProps<typeof Sidebar> & { config: SiteConfig }) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (href: Route) => pathname === href || (href !== '/' && pathname.startsWith(href));
  const { isMobile } = useSidebar();

  const authClient = createAuthClient(config);

  function handleLogout(): void {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login'); // redirect to login page
        },
      },
    });
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <ProjectSwitcher authClient={authClient} isMobile={isMobile} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive('/stats')}>
                  <Link href='/stats'>Stats</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={item.href}>{item.label}</Link>
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
                  <UserAvatarSnippet authClient={authClient} />
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
                    <UserAvatarSnippet authClient={authClient} />
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push('/account');
                    }}
                  >
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem
                    onClick={() => {
                      router.push('/billing');
                    }}
                  >
                    <CreditCard />
                    Billing
                  </DropdownMenuItem> */}
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

function UserAvatarSnippet({ authClient }: { authClient: AuthClient }) {
  const { data: session } = authClient.useSession();
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

function ProjectSwitcher({ authClient, isMobile }: { authClient: AuthClient; isMobile: boolean }) {
  const { data: projects } = authClient.useListOrganizations();
  const { data: activeProject } = authClient.useActiveOrganization();
  if (!projects || !activeProject) return null;

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
                  title={activeProject.name}
                  subtitle={activeProject.metadata.type}
                  image={activeProject.logo}
                  size={8}
                />
              </div>
              <AvatarSnippetFooter title={activeProject.name} subtitle={activeProject.metadata.type} />
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>Projects</DropdownMenuLabel>
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.name}
                onClick={async () => await authClient.organization.setActive({ organizationId: project.id })}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-md border'>
                  <AvatarSnippetHeader
                    title={project.name}
                    subtitle={project.metadata.type}
                    image={project.logo}
                    size={4}
                    className='shrink-0'
                    initialType='first'
                  />
                </div>
                {project.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='gap-2 p-2'
              onClick={() => {
                // TODO: redirect to create project page
                console.log('Add project clicked');
                // router.push('/projects/new');
              }}
            >
              <div className='flex size-6 items-center justify-center rounded-md border bg-transparent'>
                <Plus className='size-4' />
              </div>
              <div className='text-muted-foreground font-medium'>Add project</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
