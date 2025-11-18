'use client';

import {
  Building2,
  Check,
  Fingerprint,
  Home,
  LogOut,
  Monitor,
  MoreVertical,
  Pencil,
  Plus,
  Settings,
  Smartphone,
  Trash2,
} from 'lucide-react';
import type { Route } from 'next';
import { redirect, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';
import { leaveOrganization } from '@/actions/organizations';
import { deleteUser } from '@/actions/user';
import { TimeAgo } from '@/components/time-ago';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { authClient, type Organization, type Passkey, type Session } from '@/lib/auth-client';

export function ProfileSection({ user }: { user: { id: string; name: string; email: string } }) {
  const [name, setName] = useState(user.name);
  const [isNameSaving, setIsNameSaving] = useState(false);

  async function handleSave() {
    setIsNameSaving(true);
    const { data, error } = await authClient.updateUser({ name });
    setIsNameSaving(false);

    if (error || !data?.status) {
      toast.error('Failed to update profile.', { description: error?.message });
      return;
    }

    toast.success('Profile updated successfully.');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor='name'>Name</FieldLabel>
              <Input id='name' value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor='email'>Email</FieldLabel>
              <Input id='email' value={user.email} disabled className='bg-muted' />
              <FieldDescription>Email cannot be changed</FieldDescription>
            </Field>
            <Field orientation='horizontal'>
              <Button onClick={handleSave} disabled={isNameSaving || !name || name === user.name}>
                {isNameSaving ? (
                  <>
                    <Spinner className='mr-2' />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>
  );
}

export function PasskeysSection({ passkeys: initialPasskeys }: { passkeys: Passkey[] }) {
  const [isModifyingPasskeys, setIsModifyingPasskeys] = useState(false);
  const [passkeys, setPasskeys] = useState(initialPasskeys);
  const [editingPasskey, setEditingPasskey] = useState<Passkey | null>(null);
  const [editedPasskeyName, setEditedPasskeyName] = useState<string | undefined>(undefined);
  const [isSavingPasskey, setIsSavingPasskey] = useState(false);

  async function handleAddPasskey() {
    setIsModifyingPasskeys(true);
    // TODO: fix after https://github.com/better-auth/better-auth/pull/5736 is merged
    const response = await authClient.passkey.addPasskey({
      // Not setting name, as it overrides the default (email) which makes it look awkward
      // in password managers. Instead, we'll let the user edit it afterwards.
    });
    setIsModifyingPasskeys(false);
    if (response?.error) {
      if (
        'code' in response.error &&
        response.error.code !== 'AUTH_CANCELLED' &&
        response.error.code !== 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY' // from @simplewebauthn/browser
      ) {
        toast.error('Failed to add passkey.', { description: response.error.message || 'Unknown error' });
      }
      return;
    }

    const passkey = response?.data as Passkey | null | undefined;
    if (!passkey) {
      toast.error('Failed to add passkey.', {
        description:
          'No passkey data returned. This should not happen but it has and you may want to refresh the page before trying again.',
      });
      return;
    }
    setPasskeys((prev) => [...prev, passkey]);
  }

  async function handleDeletePasskey(id: string) {
    setIsModifyingPasskeys(true);
    const { error } = await authClient.passkey.deletePasskey({ id });
    setIsModifyingPasskeys(false);
    if (error) {
      toast.error('Failed to delete passkey.', { description: error.message });
      return;
    }

    setPasskeys((prev) => prev.filter((p) => p.id !== id));
  }

  function handleEditPasskey(passkey: Passkey) {
    setEditingPasskey(passkey);
    setEditedPasskeyName(passkey.name);
  }

  async function handleSavePasskeyName() {
    if (!editingPasskey || !editedPasskeyName?.trim()) return;

    setIsSavingPasskey(true);
    const { error } = await authClient.passkey.updatePasskey({
      id: editingPasskey.id,
      name: editedPasskeyName,
    });
    setIsSavingPasskey(false);
    setEditingPasskey(null);
    setEditedPasskeyName(undefined);

    if (error) {
      toast.error('Failed to update passkey name.', { description: error.message });
      return;
    }

    setPasskeys((prev) => prev.map((p) => (p.id === editingPasskey.id ? { ...p, name: editedPasskeyName } : p)));
  }

  return (
    <>
      <Card>
        {passkeys.length === 0 ? null : (
          <CardHeader>
            <div className='grid grid-cols-1 md:grid-cols-3 items-center justify-center'>
              <div className='flex flex-col gap-2 md:col-span-2'>
                <CardTitle>Passkeys</CardTitle>
                <CardDescription>Manage your passkeys for secure authentication</CardDescription>
              </div>
              <Button
                onClick={handleAddPasskey}
                disabled={isModifyingPasskeys}
                className='mt-4 lg:mt-0 lg:justify-self-end md:w-full lg:w-auto'
              >
                {isModifyingPasskeys ? (
                  <Spinner />
                ) : (
                  <>
                    <Plus className='size-4 mr-2' />
                    Add passkey
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent>
          {passkeys.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Fingerprint />
                </EmptyMedia>
                <EmptyTitle>No passkeys yet</EmptyTitle>
                <EmptyDescription>Add a passkey to enable secure, passwordless authentication</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={handleAddPasskey} disabled={isModifyingPasskeys} size='sm'>
                  {isModifyingPasskeys ? (
                    <Spinner />
                  ) : (
                    <>
                      <Plus className='size-4 mr-2' />
                      Add your first passkey
                    </>
                  )}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ItemGroup className='gap-3'>
              {passkeys.map((passkey) => (
                <Item key={passkey.id} variant='outline'>
                  <ItemMedia variant='icon' className='bg-primary/10 size-10'>
                    <Fingerprint className='text-primary size-5' />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{passkey.name || 'no name'}</ItemTitle>
                    <ItemDescription>
                      Added <TimeAgo date={passkey.createdAt} />
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button variant='ghost' size='icon' onClick={() => handleEditPasskey(passkey)}>
                      <Pencil className='size-4' />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='ghost' size='icon' disabled={isModifyingPasskeys}>
                          <Trash2 className='size-4 text-destructive' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove passkey?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will no longer be able to use this passkey to sign in. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className='bg-destructive' onClick={() => handleDeletePasskey(passkey.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!editingPasskey} onOpenChange={(open) => !open && setEditingPasskey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit passkey</DialogTitle>
            <DialogDescription>Update the name of your passkey to help you identify it.</DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='passkey-name'>Passkey name</FieldLabel>
                <Input
                  id='passkey-name'
                  value={editedPasskeyName}
                  onChange={(e) => setEditedPasskeyName(e.target.value)}
                  placeholder='e.g., MacBook Pro'
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingPasskey(null)} disabled={isSavingPasskey}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePasskeyName}
              disabled={isSavingPasskey || !editedPasskeyName?.trim() || editedPasskeyName === editingPasskey?.name}
            >
              {isSavingPasskey ? (
                <>
                  <Spinner className='mr-2' />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SessionsSection({
  activeSessionId,
  sessions: rawSessions,
}: {
  activeSessionId: string;
  sessions: Session['session'][];
}) {
  // sort sessions by updatedAt desc and place the active session at the top
  const sortedSessions = rawSessions.sort((a, b) => {
    if (a.id === activeSessionId) return -1;
    if (b.id === activeSessionId) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
  const [sessions, setSessions] = useState(sortedSessions);
  const [isModifyingSessions, setIsModifyingSessions] = useState(false);

  async function handleRevokeSession(token: string) {
    setIsModifyingSessions(true);
    const { data, error } = await authClient.revokeSession({ token });
    setIsModifyingSessions(false);

    if (error || !data.status) {
      toast.error('Failed to revoke session.', {
        description: error?.message || 'Unknown error',
      });
      return;
    }

    setSessions((prev) => prev.filter((s) => s.token !== token));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>Manage devices where you are currently signed in</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className='gap-3'>
          {sessions.map((session) => {
            const isCurrent = session.id === activeSessionId;
            function getDevice(input: string): [mobile: boolean, name: string] {
              const parser = UAParser(input);
              return [
                parser.device.type === 'mobile',
                parser.os.name && parser.browser.name
                  ? `${parser.os.name}, ${parser.browser.name}`
                  : parser.os.name || parser.browser.name || input || 'Unknown Device',
              ];
            }
            const [isMobile, deviceName] = getDevice(session.userAgent || '');
            const Icon = isMobile ? Smartphone : Monitor;

            return (
              <Item key={session.id} variant='outline'>
                <ItemMedia variant='icon' className='size-10'>
                  <Icon className='size-5' />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {deviceName}
                    {isCurrent && (
                      <Badge variant='secondary' className='text-xs ml-2'>
                        <Check className='size-3 mr-1' />
                        Current
                      </Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>
                    {session.ipAddress} • <TimeAgo date={session.updatedAt} />
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {!isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='ghost' size='sm' disabled={isModifyingSessions}>
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will sign out the device from your account. You will need to sign in again on that
                            device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevokeSession(session.token)}>
                            Revoke
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

export function OrganizationsSection({
  organizations: initialOrganizations,
  activeOrganizationId,
}: {
  activeOrganizationId?: string | null;
  organizations: Organization[];
}) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [orgToLeave, setOrgToLeave] = useState<Organization | null>(null);
  const [leaveFeedback, setLeaveFeedback] = useState('');
  const [isLeavingOrg, setIsLeavingOrg] = useState(false);

  async function handleSetActiveAndNavigate(orgId: string, path: Route) {
    const { error } = await authClient.organization.setActive({ organizationId: orgId });
    if (error) {
      toast.error('Failed to switch organization', {
        description: error.message,
      });
      return;
    }

    redirect(path);
  }

  async function handleLeaveOrg() {
    if (!orgToLeave) return;

    setIsLeavingOrg(true);
    const { error } = await leaveOrganization({ organizationId: orgToLeave.id, feedback: leaveFeedback });
    setIsLeavingOrg(false);
    setOrgToLeave(null);
    setLeaveFeedback('');
    if (error) {
      toast.error('Failed to leave organization', {
        description: error.message,
      });
      return;
    }

    // If the user left the active organization, redirect them to the dashboard root
    if (orgToLeave.id === activeOrganizationId) {
      router.push('/dashboard');
      return;
    }

    setOrganizations((prev) => prev.filter((org) => org.id !== orgToLeave.id));
  }

  return (
    <>
      <Card>
        {organizations.length === 0 ? null : (
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Organizations you are a member of</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          {organizations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Building2 />
                </EmptyMedia>
                <EmptyTitle>No organizations</EmptyTitle>
                <EmptyDescription>
                  You are not a member of any organizations yet.
                  <br />
                  Once you join or create an organization, it will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className='gap-3'>
              {organizations.map((org) => (
                <Item key={org.id} variant='outline'>
                  <ItemMedia variant='icon' className='size-10'>
                    <Building2 className='size-5' />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {org.name}
                      {org.id === activeOrganizationId && (
                        <Badge variant='default' className='text-xs ml-2'>
                          Active
                        </Badge>
                      )}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreVertical className='size-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleSetActiveAndNavigate(org.id, '/dashboard/activity')}>
                          <Home className='size-4 mr-2' />
                          Home
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetActiveAndNavigate(org.id, '/dashboard/settings')}>
                          <Settings className='size-4 mr-2' />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive'
                          onClick={() => setOrgToLeave(org)}
                        >
                          <LogOut className='size-4 mr-2' />
                          Leave
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!orgToLeave}
        onOpenChange={(open) => {
          if (!open) {
            setOrgToLeave(null);
            setLeaveFeedback('');
          }
        }}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {orgToLeave?.name}?</AlertDialogTitle>
            <AlertDialogDescription className='space-y-3'>
              <p>
                Leaving will result in the loss of your access to all resources and data associated with this
                organization.
              </p>
              <div className='space-y-2 pt-2'>
                <Label htmlFor='leave-feedback' className='text-sm font-normal text-foreground'>
                  Help us improve (optional)
                </Label>
                <Textarea
                  id='leave-feedback'
                  value={leaveFeedback}
                  onChange={(e) => setLeaveFeedback(e.target.value)}
                  placeholder='Why are you leaving? Your feedback helps us improve...'
                  className='w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                  disabled={isLeavingOrg}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeavingOrg}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveOrg} disabled={isLeavingOrg} className='bg-destructive'>
              {isLeavingOrg ? (
                <>
                  <Spinner className='mr-2' />
                  Leaving...
                </>
              ) : (
                'Leave'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DangerSection({ hasOrganizations }: { hasOrganizations: boolean }) {
  const [deleteFeedback, setDeleteFeedback] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);

    // this will trigger the delete account flow (sends a verification email, with a link)
    const { success, error } = await deleteUser({ feedback: deleteFeedback });
    setIsDeletingAccount(false);
    setShowDeleteDialog(false);
    setDeleteFeedback('');
    if (error || !success) {
      toast.error('Failed to initiate account deletion.', {
        description: error?.message || 'Unknown error',
      });
      return;
    }

    // inform the user to check their email
    toast.success('Account deletion requested.', {
      description: 'Please check your email to confirm account deletion.',
    });
  }

  return (
    <>
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-destructive'>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 items-start justify-between py-4'>
            <div className='space-y-1 md:col-span-2'>
              <p className='font-medium'>Delete account</p>
              <p className='text-sm text-muted-foreground'>Permanently delete your account and all associated data</p>
              {hasOrganizations && (
                <p className='text-xs text-destructive mt-1'>
                  You need to leave or delete all organizations before closing your account.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setDeleteFeedback('');
          }
        }}
      >
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription className='space-y-3'>
              <p>
                This action cannot be undone. This will permanently delete your account and remove all your data from
                our servers.
              </p>
              <div className='space-y-2 pt-2'>
                <Label htmlFor='delete-feedback' className='text-sm font-normal text-foreground'>
                  Help us improve (optional)
                </Label>
                <textarea
                  id='delete-feedback'
                  value={deleteFeedback}
                  onChange={(e) => setDeleteFeedback(e.target.value)}
                  placeholder='Why are you leaving? Your feedback helps us improve...'
                  className='w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                  disabled={isDeletingAccount}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <Button onClick={handleDeleteAccount} variant='destructive' disabled={isDeletingAccount}>
              {isDeletingAccount ? (
                <>
                  <Spinner className='mr-2' />
                  Deleting...
                </>
              ) : (
                'Delete account'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
