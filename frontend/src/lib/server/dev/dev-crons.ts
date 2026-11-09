// Dev-only: poll the Vercel Cron endpoints locally so outbox + email-queue
// get drained without Vercel actually running crons. In prod Vercel calls
// them directly per vercel.json; this module is never loaded there (the
// import in instrumentation.ts is gated by NODE_ENV === 'development').
//
// Side-effect import: calling `startDevCrons()` is idempotent via a module-
// level flag, but since Next.js only runs instrumentation.register() once per
// server boot there's no normal path that would call it twice.
import 'server-only';

const INTERVAL_MS = 30_000;
const INITIAL_DELAY_MS = 5_000; // give the Next dev server time to listen
const CRON_PATHS = ['/api/cron/outbox-drain', '/api/cron/email-queue-drain'] as const;

let started = false;

async function tick(baseUrl: string, cronSecret: string): Promise<void> {
  for (const path of CRON_PATHS) {
    try {
      await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
    } catch {
      // Server not ready yet, or network blip — next tick will retry.
    }
  }
}

export function startDevCrons(): void {
  if (started) return;
  started = true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn('[dev-crons] CRON_SECRET missing — dev drains disabled');

    return;
  }

  const port = process.env.PORT ?? '3000';
  const baseUrl = `http://localhost:${port}`;

  console.log(`[dev-crons] auto-draining ${CRON_PATHS.join(' + ')} every ${INTERVAL_MS / 1000}s`);

  setTimeout(() => {
    void tick(baseUrl, cronSecret);
    setInterval(() => {
      void tick(baseUrl, cronSecret);
    }, INTERVAL_MS);
  }, INITIAL_DELAY_MS);
}
