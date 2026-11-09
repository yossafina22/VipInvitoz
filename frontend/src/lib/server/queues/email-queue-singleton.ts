// frontend/src/lib/server/queues/email-queue-singleton.ts — Phase 5.
//
// Lazy-init EmailQueue. Returns null when any of UPSTASH_REDIS_REST_URL /
// UPSTASH_REDIS_REST_TOKEN / RESEND_API_KEY is missing. Callers MUST handle
// the null case gracefully — outbox-drain skips email.* events with a logged
// "email queue not configured" warning; email-queue-drain returns a no-op
// `{ ok: true, processed: 0 }` response.
//
// Pattern mirrors payments/provider-singleton.ts (lazy + cached + reset hook).
//
// DEVIATION (from plan §Task 4): the plan suggested inlining `new Resend()`
// because of unknown Mailer factory shape. The codebase already exports
// `createMailer({ RESEND_API_KEY, EMAIL_FROM })` from `lib/server/email.ts`
// (Phase 1+ canon). We use that — keeps the surface DRY and benefits from
// its built-in List-Unsubscribe header support.
import 'server-only';
import { EmailQueue } from './email-queue';
import { prisma } from '../prisma';
import { redis } from '../redis';
import { createConsoleMailer, createMailer } from '../email';
import { createLogger } from '../logger';

const log = createLogger();

let _queue: EmailQueue | null = null;
let _initialized = false;

/**
 * Lazy-init EmailQueue. Idempotent — first call constructs, subsequent calls
 * return the cached instance (or cached null if env was missing on first call).
 *
 * Returns null if any required env var is missing — caller decides whether to
 * skip work (preferred) or surface as an error.
 */
export function getEmailQueue(): EmailQueue | null {
  if (_initialized) return _queue;

  const url = process.env.UPSTASH_REDIS_REST_URL ?? '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';
  const resendKey = process.env.RESEND_API_KEY ?? '';
  const emailFrom = process.env.EMAIL_FROM ?? '';

  if (!url || !token || !resendKey || !emailFrom || !redis) {
    log.warn(
      'email-queue-singleton: not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN / RESEND_API_KEY / EMAIL_FROM required)',
    );
    _initialized = true;
    _queue = null;
    return null;
  }

  // Dev bypass — Resend's sandbox restricts sender to the account owner and
  // crons don't run locally, making signup/verify-email awkward to iterate on.
  // In dev we default to printing the verification code to the server console
  // instead of calling Resend. Opt out with DEV_EMAIL_BYPASS=0.
  const useDevBypass =
    process.env.NODE_ENV === 'development' && process.env.DEV_EMAIL_BYPASS !== '0';

  const mailer = useDevBypass
    ? createConsoleMailer()
    : createMailer({
        RESEND_API_KEY: resendKey,
        EMAIL_FROM: emailFrom,
      });

  if (useDevBypass) {
    log.warn(
      'email-queue-singleton: dev bypass active — emails will be printed to the console (set DEV_EMAIL_BYPASS=0 to use real Resend)',
    );
  }

  _queue = new EmailQueue({ redis, prisma, mailer });
  _initialized = true;
  return _queue;
}

/** Test-only — clear the cached queue. */
export function __resetEmailQueueSingleton(): void {
  _queue = null;
  _initialized = false;
}
