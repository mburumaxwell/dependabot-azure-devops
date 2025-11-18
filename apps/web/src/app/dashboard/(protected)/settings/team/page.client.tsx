'use client';

import { Mail, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteOrganization } from '@/actions/organizations';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { AssignableMemberRole, Invitation, Member } from '@/lib/auth-client';
import { authClient } from '@/lib/auth-client';
import { getInitials } from '@/lib/utils';

export function MembersSection({
  members: initialMembers,
  invitations: initialInvitations,
}: {
  members: Member[];
  invitations: Invitation[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableMemberRole>('member');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  async function handleSendInvite() {
    if (!inviteEmail.trim()) return;

    setIsSendingInvite(true);
    const { data, error } = await authClient.organization.inviteMember({
      email: inviteEmail,
      role: inviteRole,
    });
    if (error) {
      setIsSendingInvite(false);
      toast.error('Error sending invite', { description: error.message });
      return;
    }
    const invite = data as Invitation;
    setInvitations((prev) => [...prev, invite]);
    setInviteEmail('');
    setInviteRole('member');
    setIsSendingInvite(false);
    toast.success('Invite sent', { description: `Invitation sent to ${inviteEmail}` });
  }

  async function handleResendInvite(invite: Invitation) {
    setLoadingStates((prev) => ({ ...prev, [`resend-${invite.id}`]: true }));
    const { data, error } = await authClient.organization.inviteMember({
      email: invite.email,
      role: invite.role,
      resend: true,
    });
    setLoadingStates((prev) => ({ ...prev, [`resend-${invite.id}`]: false }));
    if (error) {
      toast.error('Error resending invite', { description: error.message });
      return;
    }

    invite = data as Invitation;
    if (invitations.find((inv) => inv.id === invite.id)) {
      setInvitations((prev) => prev.map((inv) => (inv.id === invite.id ? invite : inv)));
    } else {
      setInvitations((prev) => [...prev, invite]);
    }
    toast.success('Invite resent', { description: `Invitation resent to ${invite.email}` });
  }

  async function handleRevokeInvite(invite: Invitation) {
    setLoadingStates((prev) => ({ ...prev, [`revoke-${invite.id}`]: true }));
    const { error } = await authClient.organization.cancelInvitation({ invitationId: invite.id });
    setLoadingStates((prev) => ({ ...prev, [`revoke-${invite.id}`]: false }));
    if (error) {
      toast.error('Error revoking invite', { description: error.message });
      return;
    }

    setInvitations((prev) => prev.filter((inv) => inv.id !== invite.id));
    toast.success('Invite revoked', { description: 'The invitation has been revoked.' });
  }

  async function handleRemoveMember(member: Member) {
    setLoadingStates((prev) => ({ ...prev, [`remove-${member.id}`]: true }));
    const { error } = await authClient.organization.removeMember({ memberIdOrEmail: member.id });
    setLoadingStates((prev) => ({ ...prev, [`remove-${member.id}`]: false }));
    if (error) {
      toast.error('Error removing member', { description: error.message });
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    toast.success('Member removed', { description: `${member.user.name} has been removed from the organization.` });
  }

  async function handleChangeRole(member: Member, newRole: AssignableMemberRole) {
    setLoadingStates((prev) => ({ ...prev, [`role-${member.id}`]: true }));
    const { error } = await authClient.organization.updateMemberRole({
      memberId: member.id,
      role: newRole,
    });
    setLoadingStates((prev) => ({ ...prev, [`role-${member.id}`]: false }));
    if (error) {
      toast.error('Error updating member role', { description: error.message });
      return;
    }

    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m)));
    toast.success('Team role updated', { description: `${member.user.name}'s role has been changed to ${newRole}` });
  }

  return (
    <>
      {/* Invite Member */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>Send an invitation to join your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <div className='grid grid-cols-1 md:grid-cols-6 gap-2'>
                <Input
                  placeholder='chris.johnson@contoso.com'
                  type='email'
                  className='md:col-span-4'
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                  aria-label='Email address'
                />
                <Select value={inviteRole} onValueChange={(value: AssignableMemberRole) => setInviteRole(value)}>
                  <SelectTrigger className='w-full' aria-label='Role'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='member'>Member</SelectItem>
                    <SelectItem value='admin'>Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim() || isSendingInvite}
                  className='mt-4 lg:mt-0'
                >
                  {isSendingInvite ? (
                    <>
                      <Spinner className='mr-2' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Plus className='size-4 mr-2' />
                      Send invite
                    </>
                  )}
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      <Card>
        {invitations.length === 0 ? null : (
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>Invitations waiting to be accepted</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          {invitations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Mail />
                </EmptyMedia>
                <EmptyTitle>No pending invites</EmptyTitle>
                <EmptyDescription>
                  When you send invitations, they will appear here until they are accepted or expire.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className='gap-3'>
              {invitations.map((invite) => (
                <Item key={invite.id} variant='outline'>
                  <ItemMedia variant='icon' className='size-10'>
                    <Mail className='size-5' />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{invite.email}</ItemTitle>
                    <ItemDescription>
                      {invite.expiresAt < new Date() ? 'Expired' : 'Expires'} <TimeAgo date={invite.expiresAt} /> •{' '}
                      <span className='capitalize'>{invite.role}</span>
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleResendInvite(invite)}
                      disabled={loadingStates[`resend-${invite.id}`] || loadingStates[`revoke-${invite.id}`]}
                    >
                      {loadingStates[`resend-${invite.id}`] ? (
                        <>
                          <Spinner className='size-3 mr-1' />
                          Resending...
                        </>
                      ) : (
                        'Resend'
                      )}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRevokeInvite(invite)}
                      disabled={loadingStates[`resend-${invite.id}`] || loadingStates[`revoke-${invite.id}`]}
                    >
                      {loadingStates[`revoke-${invite.id}`] ? (
                        <>
                          <Spinner className='size-3 mr-1' />
                          Revoking...
                        </>
                      ) : (
                        'Revoke'
                      )}
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People who have access to this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemGroup className='gap-3'>
            {members.map((member) => (
              <Item key={member.id} variant='outline'>
                <ItemMedia>
                  <Avatar className='size-10'>
                    <AvatarFallback className='bg-primary text-primary-foreground text-sm'>
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {member.user.name}
                    <Badge variant='secondary' className='text-xs ml-2'>
                      <span className='capitalize'>{member.role}</span>
                    </Badge>
                  </ItemTitle>
                  <ItemDescription>{member.user.email}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  {member.role !== 'owner' && (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleChangeRole(member, value as AssignableMemberRole)}
                        disabled={loadingStates[`role-${member.id}`] || loadingStates[`remove-${member.id}`]}
                      >
                        <SelectTrigger className='w-[120px] h-9'>
                          {loadingStates[`role-${member.id}`] ? (
                            <div className='flex items-center'>
                              <Spinner className='size-3 mr-2' />
                              <span className='text-xs'>Updating...</span>
                            </div>
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='member'>Member</SelectItem>
                          <SelectItem value='admin'>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRemoveMember(member)}
                        disabled={loadingStates[`role-${member.id}`] || loadingStates[`remove-${member.id}`]}
                      >
                        {loadingStates[`remove-${member.id}`] ? (
                          <Spinner className='text-destructive' />
                        ) : (
                          <Trash2 className='size-4 text-destructive' />
                        )}
                      </Button>
                    </>
                  )}
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
    </>
  );
}

export function DangerSection({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  async function handleDeleteOrganization() {
    setIsDeletingOrg(true);
    const { success, error } = await deleteOrganization({ organizationId });
    setIsDeletingOrg(false);
    if (!success) {
      toast.error('Error deleting organization', { description: error?.message });
      return;
    }

    router.push('/dashboard');
  }

  return (
    <Card className='border-destructive/50'>
      <CardHeader>
        <CardTitle className='text-destructive'>Danger zone</CardTitle>
        <CardDescription>Irreversible actions for your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-3 items-start justify-between'>
          <div className='space-y-1 md:col-span-2'>
            <p className='font-medium'>Delete this organization</p>
            <p className='text-sm text-muted-foreground'>
              This action cannot be undone. All projects, data, and team members will be removed.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild disabled={isDeletingOrg}>
              <Button variant='destructive' className='mt-4 lg:mt-0 lg:justify-self-end md:w-full lg:w-auto'>
                {isDeletingOrg ? (
                  <>
                    <Spinner className='mr-2' />
                    Deleting...
                  </>
                ) : (
                  'Delete organization'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the organization and remove all associated
                  data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className='bg-destructive' onClick={handleDeleteOrganization}>
                  Delete organization
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
