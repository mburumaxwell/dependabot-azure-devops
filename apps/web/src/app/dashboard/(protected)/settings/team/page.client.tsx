'use client';

import { Mail, Plus, Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { AssignableOrganizationRole, Invitation, Member } from '@/lib/auth-client';
import { authClient } from '@/lib/auth-client';

export function MembersSection({
  members: rawMembers,
  invitations: rawInvitations,
}: {
  members: Member[];
  invitations: Invitation[];
}) {
  const [members, setMembers] = useState(rawMembers);
  const [invitations, setInvitations] = useState(rawInvitations);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AssignableOrganizationRole>('member');
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
    toast('Invite sent', { description: `Invitation sent to ${inviteEmail}` });
  }

  async function handleResendInvite(invite: Invitation) {
    setLoadingStates((prev) => ({ ...prev, [`resend-${invite.id}`]: true }));
    const { error } = await authClient.organization.inviteMember({
      email: invite.email,
      role: invite.role,
      resend: true,
    });
    setLoadingStates((prev) => ({ ...prev, [`resend-${invite.id}`]: false }));
    if (error) {
      toast.error('Error resending invite', { description: error.message });
      return;
    }

    toast('Invite resent', { description: `Invitation resent to ${invite.email}` });
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
    toast('Invite revoked', { description: 'The invitation has been revoked.' });
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
    toast('Member removed', { description: `${member.user.name} has been removed from the organization.` });
  }

  async function handleChangeRole(member: Member, newRole: AssignableOrganizationRole) {
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
    toast('Team role updated', { description: `${member.user.name}'s role has been changed to ${newRole}` });
  }

  return (
    <>
      {/* Invite Member */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>Send an invitation to join your organization</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Input
              placeholder='chris.johnson@contoso.com'
              type='email'
              className='flex-1'
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
            />
            <Select value={inviteRole} onValueChange={(value: AssignableOrganizationRole) => setInviteRole(value)}>
              <SelectTrigger className='w-[130px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='member'>Member</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSendInvite} disabled={!inviteEmail.trim() || isSendingInvite}>
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
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>Invitations waiting to be accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {invitations.map((invite) => (
                <div key={invite.id} className='flex items-center justify-between p-3 border rounded-lg'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
                      <Mail className='size-5' />
                    </div>
                    <div>
                      <p className='font-medium'>{invite.email}</p>
                      <p className='text-sm text-muted-foreground'>
                        Expires <TimeAgo date={invite.expiresAt} /> • <span className='capitalize'>{invite.role}</span>
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>People who have access to this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {members.map((member) => (
              <div key={member.id} className='flex items-center justify-between p-3 border rounded-lg'>
                <div className='flex items-center gap-3'>
                  <Avatar className='size-10'>
                    <AvatarFallback className='bg-primary text-primary-foreground text-sm'>
                      {member.user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium'>{member.user.name}</p>
                      <Badge variant='secondary' className='text-xs'>
                        <span className='capitalize'>{member.role}</span>
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>{member.user.email}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {member.role !== 'owner' && (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleChangeRole(member, value as AssignableOrganizationRole)}
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function DangerSection({ organizationId }: { organizationId: string }) {
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  async function handleDeleteOrganization() {
    setIsDeletingOrg(true);
    const { error } = await authClient.organization.delete({ organizationId });
    setIsDeletingOrg(false);
    if (error) {
      toast.error('Error deleting organization', { description: error.message });
      return;
    }

    redirect('/dashboard');
  }

  return (
    <Card className='border-destructive/50'>
      <CardHeader>
        <CardTitle className='text-destructive'>Danger zone</CardTitle>
        <CardDescription>Irreversible actions for your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <p className='font-medium'>Delete this organization</p>
            <p className='text-sm text-muted-foreground'>
              This action cannot be undone. All projects, data, and team members will be removed.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild disabled={isDeletingOrg}>
              <Button variant='destructive'>
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
