import { type EmailRequest, send } from './send';
import { MagicLink, type MagicLinkProps } from './templates/magic-link';

// This file exists to allow usage without renaming other files to tsx e.g. auth.ts

const FROM_NO_REPLY = 'Paklo (No Reply) <noreply@paklo.app>';
const SUPPORT_EMAIL = 'Paklo Support <support@paklo.app>';

type SimpleOptions = Omit<EmailRequest, 'from' | 'body' | 'subject' | 'replyTo'>;

export function sendMagicLinkEmail({ token, url, to, ...remaining }: SimpleOptions & Omit<MagicLinkProps, 'email'>) {
  if (to.length > 1) throw new Error('Only supports a single recipient');

  const email = to[0]!; // assuming single recipient for magic link
  return send({
    from: FROM_NO_REPLY,
    replyTo: SUPPORT_EMAIL,
    subject: 'Your login link',
    body: <MagicLink email={email} url={url} token={token} />,
    to,
    ...remaining,
  });
}

// export function sendDeleteVerificationEmail({ token, url, to, ...remaining }: SimpleOptions & Omit<MagicLinkProps, 'email'>) {
//   if (to.length > 1) throw new Error('Only supports a single recipient');

//   const email = to[0]!; // assuming single recipient for magic link
//   return send({
//     from: FROM_NO_REPLY,
//     replyTo: SUPPORT_EMAIL,
//     subject: 'Your login link',
//     body: <AccountDeleteVerification email={email} url={url} token={token} />,
//     to,
//     ...remaining,
//   });
// }
