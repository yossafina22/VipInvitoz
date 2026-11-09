# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Port 3001 is VipInvitoz's dev port (3000 is held by RestBallack, a different project on this machine) — always `netstat :3000` + check PID commandLine before assuming
- CRON_SECRET value in frontend/.env.local is wrapped in double quotes; bash `cut -d=` leaves them intact so shell pipelines need `| sed 's/^"//;s/"$//'` — dotenv strips them when Next loads
- Neon-pooler cold starts regularly exceed Prisma's default 2000ms transaction maxWait; any multi-insert txn in auth-adjacent code needs explicit {maxWait: 10_000, timeout: 15_000}
- Resend API key is in SANDBOX mode: Resend refuses any recipient other than the account owner (yossafina22@gmail.com). Dev bypass is the workaround; prod must verify a domain at resend.com/domains + change EMAIL_FROM
- DEV_EMAIL_BYPASS env toggle: unset or any value except '0' → console mailer in dev; set to '0' → real Resend even in dev
- Vercel Cron never runs locally. The outbox pattern (webhook handler enqueues, cron drains) silently breaks dev UX. In-process dev-crons module covers this
- tsx scratchpad gotchas: (1) stdin heredoc with TS generic syntax parses as TSX → write to file; (2) top-level await fails in default CJS mode → wrap in `async function main() {} main().catch(e=>{process.exit(1)})`
- Prisma 5 field names for VerificationCode = {usedAt, attempts, code, type, expiresAt, userId}; OutboxEvent = {status, attempts, lastError, sentAt, scheduledAt} (no processedAt); EmailJob = {subject, html, text, to, status, attempts, lastError, sentAt, scheduledAt} (no template field)
- Prisma db push on Neon warns on new unique constraints even when the affected table is empty (schema-plan safety check) — `--accept-data-loss` required even in objectively safe cases
- GuestbookEntry invariants: text-only (voice/video explicitly dropped from V1), invitationId nullable with SetNull delete behaviour, pinnedAt null = unpinned, ordering is [pinnedAt desc nulls:last, createdAt desc]
- Public invitation endpoints (POST /api/invitations/[slug]/guestbook) carry no cookies → skip verifyCsrf; rate-limit by IP via createEmailLimiter({redis}, {...}) called with email=null (IP bucket fallback)
- Image component: local /banani/* sources route through next/image with DEFAULT_SIZES per aspect ratio (16:4 → 100vw, 1:1 → 160px desktop/33vw mobile, 4:3 → 50vw/100vw, 3:4 → 50vw/100vw, 16:9 → 100vw); above-the-fold images should pass priority
- /guestbook page: client component, fetches /api/guestbook, falls back to MOCK on 401 or empty entries, shows PreviewBanner only in fallback mode (visible distinction live vs preview)

### Key Decisions
- Decision: Image.tsx uses next/image only for local /banani/* sources, keeps raw <img> for loremflickr — Reason: avoid adding remotePatterns config for external hosts; local assets get full WebP/AVIF/srcset benefit which was the actual pain point
- Decision: Default `sizes` per aspect ratio in Image component (16:4→100vw, 1:1→~160px) — Reason: avoid overfetching huge assets for small cards without forcing every caller to think about srcset
- Decision: Guestbook text-only — voice/video dropped from V1 — Reason: user explicitly asked to simplify; reduces Prisma schema, UI complexity, and file-storage concerns to zero
- Decision: /guestbook page falls back to MOCK when API returns 401 — Reason: preserves demo-ability without auth seeded; PreviewBanner only shows in fallback mode so the distinction is visible
- Decision: GuestbookEntry.invitationId is nullable with onDelete: SetNull — Reason: org can delete invitation but message history must persist; also allows manual entries without a known invited guest
- Decision: Pinned entries float via @@index([ceremonyId, pinnedAt]) + orderBy [pinnedAt desc nulls:last, createdAt desc] — Reason: single query serves both dashboard and public views with correct ordering
- Decision: Public invitation endpoints skip CSRF — Reason: pre-session routes carry no cookies, so CSRF is impossible; rate limit by IP is the real guard
- Decision: 404 on unknown invitation slug, not 403 — Reason: enumeration resistance; same posture as require-org-role in the starter
- Decision: Dev bypass defaults ON when NODE_ENV=development, opt-out via DEV_EMAIL_BYPASS=0 — Reason: Resend sandbox blocks all non-owner addresses; defaulting bypass on makes new-dev onboarding frictionless
- Decision: Dev cron runs from instrumentation.ts (protected file) via 5-line import gate — Reason: no new process to run, no second terminal; alternative scripts/dev-crons approach adds operational tax a beginner will forget
- Decision: Prisma transaction maxWait 10s / timeout 15s on auth routes — Reason: Neon-pooler cold start regularly exceeds Prisma's 2s default, surfaces as 'Unable to start transaction' Sentry errors in real dev flow

<!-- handoff:learnings:end -->
