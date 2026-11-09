/**
 * Mailer abstraction over Resend.
 *
 * The exported `Mailer` interface keeps the contract narrow so tests can
 * swap in a stub and any future provider (Postmark, SES) can be implemented
 * without touching the call sites in the email queue or auth routes.
 *
 * RFC 2369 List-Unsubscribe support is built in: pass `listUnsubscribe`
 * with a URL or mailto and the headers are added — required for high-volume
 * transactional senders to stay out of spam.
 */
import { Resend } from 'resend';

export interface ListUnsubscribe {
  url?: string;
  mailto?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** RFC 2369 — adds List-Unsubscribe + List-Unsubscribe-Post=One-Click headers. */
  listUnsubscribe?: ListUnsubscribe;
}

export interface Mailer {
  send(input: SendEmailInput): Promise<{ id: string }>;
}

export interface CreateMailerEnv {
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
}

export interface CreateMailerOptions {
  /** Override the underlying Resend client (used by tests). */
  client?: Pick<Resend, 'emails'>;
}

/**
 * Build a Mailer wired to Resend. Throws synchronously when the API key is
 * missing — fail fast at boot rather than on the first send.
 */
export function createMailer(env: CreateMailerEnv, options: CreateMailerOptions = {}): Mailer {
  if (!env.RESEND_API_KEY) {
    throw new Error('createMailer: RESEND_API_KEY is required');
  }
  if (!env.EMAIL_FROM) {
    throw new Error('createMailer: EMAIL_FROM is required');
  }

  const client = options.client ?? new Resend(env.RESEND_API_KEY);
  const from = env.EMAIL_FROM;

  return {
    async send(input: SendEmailInput): Promise<{ id: string }> {
      const headers: Record<string, string> = {};

      if (input.listUnsubscribe) {
        const parts: string[] = [];
        if (input.listUnsubscribe.mailto) parts.push(`<mailto:${input.listUnsubscribe.mailto}>`);
        if (input.listUnsubscribe.url) parts.push(`<${input.listUnsubscribe.url}>`);
        if (parts.length > 0) {
          headers['List-Unsubscribe'] = parts.join(', ');
          headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
        }
      }

      const sendArgs: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text?: string;
        headers?: Record<string, string>;
      } = {
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      };
      if (input.text !== undefined) sendArgs.text = input.text;
      if (Object.keys(headers).length > 0) sendArgs.headers = headers;

      const { data, error } = await client.emails.send(sendArgs);

      if (error) {
        throw new Error(`Resend error: ${error.message ?? String(error)}`);
      }
      if (!data?.id) {
        throw new Error('Resend returned no id');
      }

      return { id: data.id };
    },
  };
}

/**
 * Dev-only mailer: prints the email to the server console instead of calling
 * Resend. Useful when Resend is in sandbox mode (sender restricted to the
 * account owner) or when you want to iterate on auth flows without burning
 * Resend quota. The verification code — the one bit you actually need — is
 * surfaced as the first line of the dump so it's easy to copy out of the log.
 *
 * Opted in via `NODE_ENV === 'development'` by default; set
 * `DEV_EMAIL_BYPASS=0` to force-use the real Resend mailer in dev.
 */
export function createConsoleMailer(): Mailer {
  return {
    async send(input: SendEmailInput): Promise<{ id: string }> {
      // Try to pull an 8-char Crockford verification code out of the HTML
      // body — matches the format emitted by generateVerificationCode().
      const codeMatch = input.html.match(/\b[0-9A-HJKMNP-TV-Z]{8}\b/);
      const header = codeMatch ? `  CODE: ${codeMatch[0]}` : '  (no 8-char code pattern found)';

      console.log(
        [
          '',
          '────── [DEV MAILER] email bypassed (no Resend call) ──────',
          `  to     : ${input.to}`,
          `  subject: ${input.subject}`,
          header,
          '──────────────────────────────────────────────────────────',
          '',
        ].join('\n'),
      );

      return { id: `dev-${Date.now().toString(36)}` };
    },
  };
}
