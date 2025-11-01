'use client';

import { Loader2, Mail, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import type { Invitation, Member } from '@/lib/auth-client';
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
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  async function handleSendInvite() {
    if (!inviteEmail.trim()) return;

    setIsSendingInvite(true);
    const response = await authClient.organization.inviteMember({
      email: inviteEmail,
      role: 'member',
    });
    if (response.error) {
      setIsSendingInvite(false);
      toast.error('Error sending invite', { description: response.error.message });
      return;
    }
    const invite = response.data as Invitation;
    setInvitations((prev) => [...prev, invite]);
    setInviteEmail('');
    setIsSendingInvite(false);
    toast('Invite sent', { description: `Invitation sent to ${inviteEmail}` });
  }

  async function handleResendInvite(invite: Invitation) {
    const response = await authClient.organization.inviteMember({
      email: invite.email,
      role: invite.role,
      resend: true,
    });
    if (response.error) {
      toast.error('Error resending invite', { description: response.error.message });
      return;
    }

    toast('Invite resent', { description: `Invitation resent to ${invite.email}` });
  }

  async function handleRevokeInvite(invite: Invitation) {
    const response = await authClient.organization.cancelInvitation({ invitationId: invite.id });
    if (response.error) {
      toast.error('Error revoking invite', { description: response.error.message });
      return;
    }

    setInvitations((prev) => prev.filter((inv) => inv.id !== invite.id));
    toast('Invite revoked', { description: 'The invitation has been revoked.' });
  }

  async function handleRemoveMember(member: Member) {
    const response = await authClient.organization.removeMember({ memberIdOrEmail: member.id });
    if (response.error) {
      toast.error('Error removing member', { description: response.error.message });
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    toast('Member removed', { description: `${member.user.name} has been removed from the organization.` });
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
            <Button onClick={handleSendInvite} disabled={!inviteEmail.trim() || isSendingInvite}>
              {isSendingInvite ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Sending...
                </>
              ) : (
                <>
                  <Plus className='h-4 w-4 mr-2' />
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
                      <Mail className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='font-medium'>{invite.email}</p>
                      <p className='text-sm text-muted-foreground'>
                        Expires <TimeAgo date={invite.expiresAt} /> • {invite.role}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handleResendInvite(invite)}>
                      Resend
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => handleRevokeInvite(invite)}>
                      Revoke
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
                        {member.role}
                      </Badge>
                    </div>
                    <p className='text-sm text-muted-foreground'>{member.user.email}</p>
                  </div>
                </div>
                {member.role !== 'owner' && (
                  <Button variant='ghost' size='sm'>
                    <Trash2 className='h-4 w-4 text-destructive' onClick={() => handleRemoveMember(member)} />
                  </Button>
                )}
              </div>
            ))}
          </div>
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
    const response = await authClient.organization.delete({ organizationId });
    setIsDeletingOrg(false);
    if (response.error) {
      toast.error('Error deleting organization', { description: response.error.message });
      return;
    }

    router.push('/dashboard/select-organization');
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
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
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
