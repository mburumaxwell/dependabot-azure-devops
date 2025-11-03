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
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { UAParser } from 'ua-parser-js';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
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
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Name</Label>
          <Input id='name' value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='email'>Email</Label>
          <Input id='email' value={user.email} disabled className='bg-muted' />
          <p className='text-xs text-muted-foreground'>Email cannot be changed</p>
        </div>
        <div className='flex justify-end'>
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
        </div>
      </CardContent>
    </Card>
  );
}

export function PasskeysSection({ passkeys: rawPasskeys }: { passkeys: Passkey[] }) {
  const [isModifyingPasskeys, setIsModifyingPasskeys] = useState(false);
  const [passkeys, setPasskeys] = useState(rawPasskeys);
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
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Passkeys</CardTitle>
                <CardDescription>Manage your passkeys for secure authentication</CardDescription>
              </div>
              <Button onClick={handleAddPasskey} disabled={isModifyingPasskeys}>
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
            <div className='flex flex-col items-center justify-center py-3 text-center'>
              <div className='flex size-16 items-center justify-center rounded-full bg-muted mb-4 p-2'>
                <Fingerprint className='size-8 text-muted-foreground' />
              </div>
              <h3 className='font-medium mb-1'>No passkeys yet</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Add a passkey to enable secure, passwordless authentication
              </p>
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
            </div>
          ) : (
            <div className='space-y-3'>
              {passkeys.map((passkey) => (
                <div key={passkey.id} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                      <Fingerprint className='size-5 text-primary' />
                    </div>
                    <div>
                      <p className='font-medium'>{passkey.name || 'no name'}</p>
                      <p className='text-sm text-muted-foreground'>
                        Added <TimeAgo date={passkey.createdAt} />
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!editingPasskey} onOpenChange={(open) => !open && setEditingPasskey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit passkey</DialogTitle>
            <DialogDescription>Update the name of your passkey to help you identify it.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='passkey-name'>Passkey name</Label>
              <Input
                id='passkey-name'
                value={editedPasskeyName}
                onChange={(e) => setEditedPasskeyName(e.target.value)}
                placeholder='e.g., MacBook Pro'
              />
            </div>
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
        <div className='space-y-3'>
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
              <div key={session.id} className='flex items-center justify-between p-3 border rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
                    <Icon className='size-5' />
                  </div>
                  <div>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium'>{deviceName}</p>
                      {isCurrent && (
                        <Badge variant='secondary' className='text-xs'>
                          <Check className='size-3 mr-1' />
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {session.ipAddress} • <TimeAgo date={session.updatedAt} />
                    </p>
                  </div>
                </div>
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
                        <AlertDialogAction onClick={() => handleRevokeSession(session.token)}>Revoke</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function OrganizationsSection({
  organizations: rawOrganizations,
  activeOrganizationId,
}: {
  activeOrganizationId?: string | null;
  organizations: Organization[];
}) {
  const [organizations, setOrganizations] = useState(rawOrganizations);
  const [orgToLeave, setOrgToLeave] = useState<Organization | null>(null);

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

    const { error } = await authClient.organization.leave({ organizationId: orgToLeave.id });
    setOrgToLeave(null);
    if (error) {
      toast.error('Failed to leave organization', {
        description: error.message,
      });
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
            <div className='flex flex-col items-center justify-center py-3 text-center'>
              <div className='flex size-16 items-center justify-center rounded-full bg-muted mb-4'>
                <Building2 className='size-8 text-muted-foreground' />
              </div>
              <h3 className='font-medium mb-1'>No organizations</h3>
              <p className='text-sm text-muted-foreground'>
                You are not a member of any organizations yet.
                <br />
                Once you join or create an organization, it will appear here.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {organizations.map((org) => (
                <div key={org.id} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
                      <Building2 className='size-5' />
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium'>{org.name}</p>
                        {org.id === activeOrganizationId && (
                          <Badge variant='default' className='text-xs'>
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!orgToLeave} onOpenChange={(open) => !open && setOrgToLeave(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave organization?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <span className='font-medium'>{orgToLeave?.name}</span>? You will lose
              access to all resources and data associated with this organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveOrg} className='bg-destructive'>
              Leave organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DangerSection({ hasOrganizations }: { hasOrganizations: boolean }) {
  async function handleDeleteAccount() {
    // this will trigger the delete account flow (sends a verification email, with a link)
    const { data, error } = await authClient.deleteUser({ callbackURL: '/login' });
    if (error || !data?.success) {
      toast.error('Failed to initiate account deletion.', {
        description: error?.message || data?.message || 'Unknown error',
      });
      return;
    }

    // inform the user to check their email
    toast('Account deletion requested.', {
      description: 'Please check your email to confirm account deletion.',
    });
  }

  return (
    <Card className='border-destructive/50'>
      <CardHeader>
        <CardTitle className='text-destructive'>Danger Zone</CardTitle>
        <CardDescription>Irreversible actions for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-start justify-between py-4'>
          <div className='space-y-1'>
            <p className='font-medium'>Delete account</p>
            <p className='text-sm text-muted-foreground'>Permanently delete your account and all associated data</p>
            {hasOrganizations && (
              <p className='text-xs text-destructive mt-1'>
                You need to leave all organizations before closing your account.
              </p>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive' disabled={hasOrganizations}>
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from
                  our servers. If you proceed, you will receive a verification email to confirm this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className='bg-destructive' onClick={handleDeleteAccount}>
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
