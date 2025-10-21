import { type EmailRequest, send } from './send';
import { MagicLink, type MagicLinkProps } from './templates/magic-link';

// This file exists to allow usage without renaming other files to tsx e.g. auth.ts

const FROM_NO_REPLY = 'noreply@paklo.app';

type SimpleOptions = Omit<EmailRequest, 'from' | 'body' | 'subject'>;

export function sendMagicLinkEmail({ token, url, ...remaining }: SimpleOptions & MagicLinkProps) {
  return send({
    from: FROM_NO_REPLY,
    subject: 'Your login link',
    body: <MagicLink url={url} token={token} />,
    ...remaining,
  });
}
