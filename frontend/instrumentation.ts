// CRITICAL: keep Sentry imports inside `register()` to preserve runtime-conditional
// boot. registerOTel() is safe to call from both nodejs and edge runtimes.
import { registerOTel } from '@vercel/otel';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate env at boot — throws if required vars are missing/malformed.
    // Must run BEFORE Sentry init so the error has a chance to land in logs
    // even when Sentry is misconfigured.
    await import('./src/lib/server/env');
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
  registerOTel({ serviceName: 'izikit' });

  // Dev-only: Vercel Cron doesn't run locally, so signup/verify-email get
  // stuck in the outbox queue. Start an in-process drainer to mimic the cron.
  // Import-gated to keep it entirely absent from the prod bundle.
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'development') {
    const { startDevCrons } = await import('./src/lib/server/dev/dev-crons');
    startDevCrons();
  }
}

// Required for Sentry to capture unhandled route errors (Next.js 15+).
// Sentry 10.x renamed onRequestError → captureRequestError; alias preserves
// the export name Next.js looks for.
export { captureRequestError as onRequestError } from '@sentry/nextjs';
