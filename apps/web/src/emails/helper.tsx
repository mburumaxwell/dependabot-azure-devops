import { type EmailRequest, send } from './send';
import {
  MagicLink,
  type MagicLinkProps,
  OrganizationInvite,
  OrganizationInviteDeclined,
  type OrganizationInviteDeclinedProps,
  type OrganizationInviteProps,
  UserDeleteVerification,
  type UserDeleteVerificationProps,
} from './templates';

// This file exists to allow usage without renaming other files to tsx e.g. auth.ts

const FROM_NO_REPLY = 'Paklo (No Reply) <noreply@paklo.app>';
const SUPPORT_EMAIL = 'Paklo Support <support@paklo.app>';

type SimpleOptions = Omit<EmailRequest, 'from' | 'body' | 'subject' | 'replyTo' | 'to'> & {
  recipient: string;
};

export function sendMagicLinkEmail({
  url,
  recipient,
  ...remaining
}: SimpleOptions & Omit<MagicLinkProps, 'recipient'>) {
  return send({
    from: FROM_NO_REPLY,
    replyTo: SUPPORT_EMAIL,
    subject: 'Your login link',
    body: <MagicLink recipient={recipient} url={url} />,
    to: recipient,
    ...remaining,
  });
}

export function sendUserDeleteVerificationEmail({
  url,
  recipient,
  ...remaining
}: SimpleOptions & Omit<UserDeleteVerificationProps, 'recipient'>) {
  return send({
    from: FROM_NO_REPLY,
    replyTo: SUPPORT_EMAIL,
    subject: 'Confirm your account deletion',
    body: <UserDeleteVerification recipient={recipient} url={url} />,
    to: recipient,
    ...remaining,
  });
}

export function sendOrganizationInviteEmail({
  organization,
  inviter,
  acceptUrl,
  declineUrl,
  recipient,
  expires,
  ...remaining
}: SimpleOptions & Omit<OrganizationInviteProps, 'recipient'>) {
  return send({
    from: FROM_NO_REPLY,
    replyTo: SUPPORT_EMAIL,
    subject: `Invitation to join the ${organization} organization`,
    body: (
      <OrganizationInvite
        organization={organization}
        inviter={inviter}
        acceptUrl={acceptUrl}
        declineUrl={declineUrl}
        recipient={recipient}
        expires={expires}
      />
    ),
    to: recipient,
    ...remaining,
  });
}

export function sendOrganizationInviteDeclinedEmail({
  organization,
  invitee,
  recipient,
  ...remaining
}: SimpleOptions & Omit<OrganizationInviteDeclinedProps, 'recipient'>) {
  return send({
    from: FROM_NO_REPLY,
    replyTo: SUPPORT_EMAIL,
    subject: `Invitation to join the ${organization} organization declined`,
    body: <OrganizationInviteDeclined organization={organization} invitee={invitee} recipient={recipient} />,
    to: recipient,
    ...remaining,
  });
}
