---
date: 2026-11-13T23:48:30.916Z
project: VipInvitoz
session: b52493e7
schema_version: 1
next_steps_count: 5
has_blockers: false
keywords: vercel, deploy, smoke-test, vipinvitoz, cron, pro-plan, env-vars, resend-sandbox
headline: Ship VipInvitoz (Next.js 16 SaaS for African ceremonies: mariage/baptême/anniversaire/deuil) to production on Vercel. Co
---

# Session Handoff Snapshot
> **Generated:** 14.11.2026, 00:48:30

## 🎯 High-Level Objective
* **Goal:** Ship VipInvitoz (Next.js 16 SaaS for African ceremonies: mariage/baptême/anniversaire/deuil) to production on Vercel. Core intent: user wants a live URL friends can visit, with signup → verify → create ceremony → upload cover → AI generation → invite guests → RSVP working end-to-end in prod.

## 📌 Current State & Next Steps
* **Status:** DONE: (1) App deployed at https://vip-invitoz.vercel.app, (2) APP_URL env var set to prod URL, (3) Vercel Pro active so 60s function timeout + sub-minute crons, (4) vercel.json restored to */1 schedules, (5) All 14 commits pushed to github.com/yossafina22/VipInvitoz main. REMAINING: (1) Smoke test end-to-end in prod — signup, verify code email, create ceremony, upload cover, AI generation, invite a guest, RSVP flow, (2) Resend sandbox limitation means only yossafina22@gmail.com receives real emails — need custom domain verified in Resend before inviting external users, (3) Remaining features from plan: QR check-in day-of, AI chatbot modification, Account + Subscription pages, unit tests for ~25 new routes.
* **Next Action:** Open https://vip-invitoz.vercel.app and do full smoke test: (1) signup with yossafina22@gmail.com (sandbox limit), (2) verify email code arrives within 1 min, (3) enter code → logged in, (4) create ceremony (any type), (5) upload cover photo, (6) click 'Générer avec IA', (7) preview invitation, (8) add self as guest, (9) send invitation, (10) open received link in incognito + confirm RSVP

### Remaining Queue
- [ ] If any smoke-test step fails: check Vercel function logs at https://vercel.com/fluxiateam/vip-invitoz/logs (filter by error status 5xx or by route path)
- [ ] Once smoke test passes: verify custom domain for Resend at resend.com/domains so non-yossafina22 emails work — currently sandbox limits to 1 recipient
- [ ] Decide on remaining feature priority: (A) QR check-in day-of flow, (B) AI chatbot ceremony modification, (C) Account + Subscription pages wiring, (D) unit tests backfill for ~25 new routes/helpers
- [ ] Optional: set up Vercel Analytics (click 'Enable Speed Insights' from deploy success page) to see real traffic

## 🛠️ Modified Files Delta
* frontend/vercel.json: twice-modified — first set all crons to daily staggered (commit 62e325e), then restored to */1 */1 0h */5 0h 0h (commit 1619ccf) after Pro upgrade

## 🚫 Failed Approaches (DO NOT RETRY)
* Approach: Deploy to Vercel Hobby with original */1 cron schedules → Result: Vercel rejected deploy with 'hobby account is limited to daily cron jobs' → Lesson: Hobby tier cron frequency floor is daily (0 X * * *); sub-daily needs Pro or external cron service
* Approach: Suggested cron-job.org as free workaround to keep Hobby → Result: user opted to pay Pro instead → Lesson: for commercial SaaS, Pro is justified by TOS + 60s timeout alone, not just cron

## 🔑 Crucial Context & Implicit Rules
* Prod URL: https://vip-invitoz.vercel.app — Vercel team 'fluxiateam', project 'vip-invitoz'
* Vercel settings page: https://vercel.com/fluxiateam/vip-invitoz/settings/environment-variables
* Vercel plan: Pro ($20/mo) — sub-minute crons + 60s function timeout + commercial-use allowed
* Email var name is EMAIL_FROM (NOT RESEND_FROM) — I initially said RESEND_FROM by mistake, corrected after grep showed EMAIL_FROM is what frontend/src/lib/server/email.ts expects
* Resend still in sandbox: only yossafina22@gmail.com receives real emails in prod until a custom domain is verified at resend.com/domains
* DEV_EMAIL_BYPASS must NOT be set in Vercel (its presence routes emails to console instead of Resend) — absence = real emails sent
* Cron routes are all POST (not GET) with Authorization: Bearer <CRON_SECRET> header — Vercel's native cron sends this header automatically, external cron needs to add it manually
* Vercel 'Optional Integrations' step after project creation = marketplace upsells; always skip for projects with own provider accounts
* Git identity per-commit via env vars (NEVER git config): GIT_AUTHOR_NAME='Yossafina' GIT_AUTHOR_EMAIL='yossafina22@gmail.com' GIT_COMMITTER_NAME='Yossafina' GIT_COMMITTER_EMAIL='yossafina22@gmail.com'

## Key Decisions
- Decision: Vercel Pro upgrade ($20/mo) — Reason: Hobby 10s function timeout would kill Anthropic AI calls that take 15-30s; Hobby TOS forbids commercial use; daily-only crons would delay verification emails up to 24h
- Decision: Ignored Vercel's Optional Integrations suggestions (Prisma Postgres, Resend, Sentry, Upstash) — Reason: user already has own Neon + Resend + Upstash accounts, clicking Add would create unlinked duplicate accounts
- Decision: Reuse same Neon DB for prod (not new branch) — Reason: user chose option A for speed; same data visible in dev + prod which is fine for solo-dev MVP
- Decision: APP_URL set to https://vip-invitoz.vercel.app (no trailing slash) in all 3 Vercel envs (Production, Preview, Development) — Reason: controls link generation for invitation emails, cookie scoping; trailing slash can break URL concatenation

## 🙋 User Contribution (human-authored)
User created Vercel account, imported repo, pasted all env vars manually in Vercel dashboard, chose Root Directory = frontend, clicked Create Project, upgraded personal account to Pro plan with real payment, updated APP_URL env var, triggered redeploys. User also corrected me when I said RESEND_FROM — they pointed out their .env.local uses EMAIL_FROM.

## 🙋 User Decisions (made by the human)
- **Reuse same Neon DB for prod (option A)**
  - Reason: Speed — same data visible across dev/prod acceptable for solo MVP
  - Rejected: Option B: create new Neon branch dedicated to prod
- **Upgrade to Vercel Pro ($20/mo)**
  - Reason: User explicitly asked 'c est pas mieux de payer l abonnement sur vercel?' then said 'c est paye'
  - Rejected: Option A (cron-job.org free workaround staying on Hobby) + Option C (daily crons, broken emails)
- **Continue smoke tests tomorrow instead of now**
  - Reason: User fatigue — 'on peut continue les tests demain sauvegarde et rapell moi demain'
  - Rejected: Running the 10-step smoke test checklist in the current session

## Summary
Session took VipInvitoz from local-only to deployed-on-Vercel-Pro. 14 commits total on main (a90c1f4 → 1619ccf). Latest 2 commits this session: 62e325e (daily crons for Hobby compat, later reverted) + 1619ccf (restored sub-minute crons after user upgraded to Pro). App is live at https://vip-invitoz.vercel.app. All env vars populated in Vercel (DATABASE_URL, DIRECT_URL, JWT_SECRET, COOKIE_PREFIX, APP_URL, ANTHROPIC_API_KEY, CLOUDINARY_*, RESEND_API_KEY, EMAIL_FROM, UPSTASH_*, CRON_SECRET). Ignored all "Optional Integrations" (Prisma Postgres, Resend, Sentry, Upstash) because user already has own accounts. Hit Hobby cron-frequency limit mid-deploy → downgraded all crons to daily, got deploy through, user then upgraded to Pro ($20/mo) so restored originals. Smoke test NOT yet done — user paused session to continue tomorrow.

---
*A short hint surfaces on session start; full context loads only if your next prompt matches a keyword above, or via manual `/handoff-resume`. The same record is available as a sibling `.json` file for external tools.*