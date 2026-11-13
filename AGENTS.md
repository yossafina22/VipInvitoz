# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Port 3000 is now VipInvitoz dev port (RestBallack no longer there); stale process from prior session killed (was PID 9108)
- Resend is in sandbox mode: only sends to yossafina22@gmail.com. Dev defaults to console mailer via DEV_EMAIL_BYPASS (unset = bypass ON); set to '0' to use real Resend
- Vercel Cron routes do not fire locally — in-process dev-crons module from instrumentation.ts polls outbox-drain + email-queue-drain every 30s
- Neon-pooler cold starts regularly exceed Prisma's 2s default; use { maxWait: 10_000, timeout: 15_000 } on auth + AI + any multi-insert txn
- Git identity set per commit via env vars (never config): GIT_AUTHOR_NAME='Yossafina' GIT_AUTHOR_EMAIL='yossafina22@gmail.com' GIT_COMMITTER_NAME='Yossafina' GIT_COMMITTER_EMAIL='yossafina22@gmail.com'
- GitHub remote: https://github.com/yossafina22/VipInvitoz (branch main)
- Cloudinary env vars required for /api/upload: CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET — missing → 503 STORAGE_NOT_CONFIGURED, app still boots
- ANTHROPIC_API_KEY required for AI generation — missing → 503 AI_NOT_CONFIGURED, credit NOT consumed; upstream failure → 502 AI_CALL_FAILED, credit IS consumed
- /api/upload uses multipart/form-data — the shared api() helper (JSON only) is incompatible; use lib/upload-client.ts which mirrors CSRF double-submit
- Protected files per CLAUDE.md (do NOT modify): auth.ts, crypto.ts, logger.ts, redis.ts, webhook/handler.ts, oauth/google.ts, outbox/dispatcher.ts, admin/audit.ts, middleware/index.ts, instrumentation.ts (5-line dev-crons exception stands), api.ts, payments/circuit-breaker.ts
- pre-commit hook: format + lint + typecheck + 555 tests (1-3 min typical)
- @next/next/no-img-element rule NOT configured in flat config — use plain <img> without eslint-disable comment
- CRLF warnings on Windows are benign
- Pnpm workspace: root package.json delegates scripts via `pnpm --filter frontend run X`; use `pnpm -w run format` at repo root, `pnpm typecheck` from frontend/

### Key Decisions
- Decision: Cover upload via dedicated lib/upload-client.ts (multipart) — Reason: shared api() uses JSON.stringify unconditionally; separate helper keeps CSRF double-submit aligned without complicating the wrapper
- Decision: Debit AI credit BEFORE calling Claude — Reason: PRD rule 'pay for the attempt'; prevents concurrent clicks double-spending
- Decision: ANTHROPIC_API_KEY missing → 503 AI_NOT_CONFIGURED without consuming credit — Reason: user never got a result; distinct from upstream Claude failure
- Decision: Organizer preview via /ceremonies/[id]/preview using authenticated GET /api/ceremonies/[id] — Reason: avoids creating fake guests or mutating data; no new API route
- Decision: QR code client-side via qrcode lib (already installed) with EC level H — Reason: real scannable QR, 30% damage tolerance, mobile-camera friendly
- Decision: Occasion CRUD = 3 separate routes (POST + PATCH + DELETE on individual IDs) — Reason: PATCH ceremony body stays small, each occasion has stable ID for in-place edit
- Decision: DELETE occasion refuses OCCASION_LAST_REMAINING — Reason: ceremony must keep one row to carry date/location; UI needs anchor
- Decision: Dashboard 'RSVP en attente' = PENDING invitations + guests without any invitation — Reason: reflects real work left for organizer, not just non-responders
- Decision: Preview page disables RSVP (opacity + pointer-events-none) rather than removing — Reason: organizer sees identical layout to judge rendering
- Decision: Cover aspect-[4/3] lg:aspect-[16/10] on /i/[slug] — Reason: proportional across viewports; closer to Banani 15 spec than fixed heights

<!-- handoff:learnings:end -->
