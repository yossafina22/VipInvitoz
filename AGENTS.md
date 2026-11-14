# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Prod URL: https://vip-invitoz.vercel.app — Vercel team 'fluxiateam', project 'vip-invitoz'
- Vercel settings page: https://vercel.com/fluxiateam/vip-invitoz/settings/environment-variables
- Vercel plan: Pro ($20/mo) — sub-minute crons + 60s function timeout + commercial-use allowed
- Email var name is EMAIL_FROM (NOT RESEND_FROM) — I initially said RESEND_FROM by mistake, corrected after grep showed EMAIL_FROM is what frontend/src/lib/server/email.ts expects
- Resend still in sandbox: only yossafina22@gmail.com receives real emails in prod until a custom domain is verified at resend.com/domains
- DEV_EMAIL_BYPASS must NOT be set in Vercel (its presence routes emails to console instead of Resend) — absence = real emails sent
- Cron routes are all POST (not GET) with Authorization: Bearer <CRON_SECRET> header — Vercel's native cron sends this header automatically, external cron needs to add it manually
- Vercel 'Optional Integrations' step after project creation = marketplace upsells; always skip for projects with own provider accounts
- Git identity per-commit via env vars (NEVER git config): GIT_AUTHOR_NAME='Yossafina' GIT_AUTHOR_EMAIL='yossafina22@gmail.com' GIT_COMMITTER_NAME='Yossafina' GIT_COMMITTER_EMAIL='yossafina22@gmail.com'

### Key Decisions
- Decision: Vercel Pro upgrade ($20/mo) — Reason: Hobby 10s function timeout would kill Anthropic AI calls that take 15-30s; Hobby TOS forbids commercial use; daily-only crons would delay verification emails up to 24h
- Decision: Ignored Vercel's Optional Integrations suggestions (Prisma Postgres, Resend, Sentry, Upstash) — Reason: user already has own Neon + Resend + Upstash accounts, clicking Add would create unlinked duplicate accounts
- Decision: Reuse same Neon DB for prod (not new branch) — Reason: user chose option A for speed; same data visible in dev + prod which is fine for solo-dev MVP
- Decision: APP_URL set to https://vip-invitoz.vercel.app (no trailing slash) in all 3 Vercel envs (Production, Preview, Development) — Reason: controls link generation for invitation emails, cookie scoping; trailing slash can break URL concatenation

<!-- handoff:learnings:end -->
