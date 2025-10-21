import { render } from '@react-email/render';
import React from 'react';
import {
  Resend,
  type Attachment as ResendAttachment,
  type CreateEmailOptions as ResendCreateEmailOptions,
  type Tag as ResendTag,
} from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY ?? 'temp');

type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

export type EmailBody = {
  /** HTML content of the email. */
  html: string;

  /** Text content of the email. */
  text: string;
};

export type EmailAttachment = {
  /**
   * Name of the attachment.
   * @example `book.pdf`
   */
  name: string;

  /**
   * Identifier of the attachment, in case we are referencing it
   * @example `cid:123book.pdf`
   */
  id?: string;

  /**
   * Content type.
   * @example `application/json`
   * @example `image/png`
   */
  type: string;

  /**
   * Base64 encoded content.
   * @example `fs.readFileSync('/Folder/book.pdf').toString('base64')`
   */
  content: string;
};

export type EmailRequest = {
  /**
   * Email address of the sender.
   * To include a friendly name, use the format `"Your Name <sender@domain.com>"`
   * @example `support@paklo.app`
   * @example `Feedback <feedback@paklo.app>`
   * @remarks
   * This email address or its domain must be verified with the chosen provider.
   * Common email addresses can be found in the `emails` object in the `@paklo/core/shared-/data` module.
   *
   * `import { emails } from '@paklo/core/shared-data';`
   */
  from: string;

  /**
   * Email address to reply to.
   * @example `support@paklo.app`
   * @remarks
   * Set this when you want to replies to be sent to an address different from the sender specified in `from`.
   */
  replyTo?: string;

  /**
   * Email addresses of the recipients.
   * @example `['alice@gmail.com', 'bob@gmail.com']`
   * @remarks Each recipient will know who the other recipients are.
   */
  to: string[];

  /** Email addresses of the CC recipients. */
  cc?: string[];

  /** Email addresses of the BCC recipients. */
  bcc?: string[];

  /**
   * Subject of the email.
   * @example `Welcome to Paklo!`
   */
  subject: string;

  /**
   * Body of the email.
   * Setting this to a React element will render the component using `@react-email/render`.
   * @example `<WelcomeEmail name="Alice" />`
   */
  body: EmailBody | React.ReactElement;

  /**
   * Type of email to send.
   *
   * @enum `'transactional'` - Email is transactional and sent to a specific recipient.
   * @enum `'broadcast'` - Email is broadcasted to multiple recipients.
   *
   * @default `'transactional'`
   *
   * @remarks
   * Separate domains should also be used to maintain sender reputation.
   */
  type?: 'transactional' /*| 'broadcast'*/;

  attachments?: EmailAttachment[];

  /** Additional/custom headers to include in the email. */
  headers?: Record<string, string>;

  /**
   * Metadata or tags to include in the email.
   *
   * @description
   * Keys and values must not be more than 256 characters and can only contain
   * ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-).
   *
   * @example `{ user_id: '123', device: 'mobile' }`
   *
   * @remarks
   * This can be used to track additional information about the email.
   * For example, you can include the user ID, the type of email, or the campaign ID.
   */
  metadata?: Record<string, string>;
};

export type EmailResponse = RequireAtLeastOne<{
  /** Unique identifier of the email. */
  id?: string;

  /** Error details if the email failed to send. */
  error?: {
    /** Error code. */
    code?: string;

    /** Error message. */
    message?: string;
  };
}>;

/**
 * Sends an email using the provided request parameters.
 * @param request - The request object containing the email details.
 */
export async function send(request: EmailRequest): Promise<EmailResponse> {
  const { from, replyTo, to, cc, bcc, subject, body: originalBody, attachments, headers, metadata } = request;

  const body = await inferBody(originalBody);

  const { html, text } = body;

  const message: ResendCreateEmailOptions = {
    from,
    replyTo: replyTo,
    to,
    cc,
    bcc,
    subject,
    html,
    text,
    attachments: attachments?.map(
      ({ name, type, content }) => ({ content, filename: name, contentType: type }) satisfies ResendAttachment,
    ),
    headers,
    tags: metadata && Object.entries(metadata).map(([key, value]) => ({ name: key, value }) satisfies ResendTag),
  };

  const { data, error } = await resend.emails.send(message);
  if (data) return { id: data.id };
  return { error: { code: error!.name, message: error!.message } };
}

async function inferBody(value: EmailRequest['body']): Promise<EmailBody> {
  if (React.isValidElement(value)) {
    const html = await render(value, { pretty: true });
    const text = await render(value, { pretty: true, plainText: true });
    return { html, text };
  }

  // get the html and text properties from the value
  const html = 'html' in value && typeof value.html === 'string' ? value.html : undefined;
  const text = 'text' in value && typeof value.text === 'string' ? value.text : undefined;
  if (html && text) return { html, text };
  throw new Error('Email body must have `html` and `text` properties or be a React element.');
}
