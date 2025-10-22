import { type EmailRequest, send } from './send';
import { MagicLink, type MagicLinkProps } from './templates/magic-link';

// This file exists to allow usage without renaming other files to tsx e.g. auth.ts

const FROM_NO_REPLY = 'Paklo (No Reply) <noreply@paklo.app>';
const SUPPORT_EMAIL = 'Paklo Support <support@paklo.app>';

type SimpleOptions = Omit<EmailRequest, 'from' | 'body' | 'subject' | 'replyTo'>;

export function sendMagicLinkEmail({ token, url, ...remaining }: SimpleOptions & Omit<MagicLinkProps, 'email'>) {
  const email = remaining.to[0]!; // assuming single recipient for magic link
  return send({
    from: FROM_NO_REPLY,
    replyTo: SUPPORT_EMAIL,
    subject: 'Your login link',
    body: <MagicLink email={email} url={url} token={token} />,
    ...remaining,
  });
}
