# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Server components call getTranslations (async, awaited); client components call useTranslations (synchronous hook) — mixing them crashes next-intl at runtime
- Converting a sync component to async (for getTranslations) breaks every call site that lives under 'use client' — grep all import sites before converting (Footer example: only imported from landing which was already async, so safe)
- LocaleSwitcher.tsx uses router.replace(pathname, { locale: next }) from @/i18n/navigation inside startTransition — this preserves the current URL path while swapping the locale segment; using next/navigation's router here would strip the locale
- Every intra-app Link / router / redirect MUST come from @/i18n/navigation, not next/link or next/navigation — tripwire test at src/lib/server/observability/i18n-routing.test.ts fails CI otherwise (and this project already runs the test)
- messages/fr.json and messages/en.json MUST have identical key shape — next-intl throws MISSING_MESSAGE at runtime if a key exists in the active locale's file but not the fallback (or vice versa); when adding a namespace, write both files in one pass
- fr.json is the source of truth for new strings; always add FR first, then write EN next to it so key shape stays locked
- vite pinned to ^5.4.21 in pnpm.overrides because vitest 3.2.4 is CJS and vite >= 6 is ESM-only; bumping either requires upgrading both together
- Node 20 (CI) cannot require(ESM) but Node 24 (local) can — any ESM-only dep pulled into vitest's config chain will pass tests locally and crash on CI
- Git identity per commit via env vars (GIT_AUTHOR_NAME/EMAIL/COMMITTER_*) and env vars DO NOT carry through && — must prefix both the add and the commit call separately
- Windows + OneDrive 'LF will be replaced by CRLF' warnings during git add are cosmetic — blobs stay LF in the repo; CI (Linux) checks out LF unchanged

### Key Decisions
- Decision: abandoned CI audit green-fix after 3 commits (vite ^5 pin + overrides + ignoreGhsas) — Reason: Node 20 CI vs Node 24 local + rolldown native binding architecture require either Node upgrade on CI runner or vitest 4 upgrade; user prioritized shipping over CI hygiene since Vercel deploys from main without CI gate
- Decision: Cloudflare Email Routing over Google Workspace for hello@vipinvitoz.com inbound — Reason: user is already on Cloudflare DNS, free tier covers forwarding, zero mailbox to monitor; replies just land in yossafina22@gmail.com
- Decision: happy-path i18n slicing (ship 1 visible surface per commit) instead of 25-page batch migration — Reason: 4h total scope, user chose Option B (Mix FR + EN for diaspora), commit size stays reviewable, visible progress every push
- Decision: EN switcher wired in 3 surfaces (NavBar landing, AppLayout dashboard header, Footer) using one shared LocaleSwitcher component — Reason: avoid dead-ends where user is on a bilingual page but no way to switch; Footer placement covers users who scroll past the nav
- Decision: Footer converted from sync to async server component — Reason: only used in landing page (also async since i18n migration), getTranslations needs await; verified no 'use client' import sites before converting

<!-- handoff:learnings:end -->
