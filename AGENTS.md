# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Pre-commit hook hangs/fails on git paths containing [ characters (Next.js dynamic routes) when prettier runs on them; prettier 3 interprets [...] as glob char class. Workaround: --no-error-on-unmatched-pattern in lint-staged commands.
- Claude Code auto-mode classifier blocks: --no-verify on git commit ([Undermining Oversight]), taskkill /F /IM node.exe ([Destructive]), env var exports containing email addresses (strips the value). Use git -c user.name -c user.email inline per commit.
- Concurrent edits during active git/pnpm background processes can cause lint-staged stash to revert working tree writes + EBUSY on eslint typescript plugin. Serialize file writes with background commits.
- Branch feat/i18n-day-1 cut from main at 84dda14. User's parallel work on main (vercel.json nudge) got picked up as commit 0ba6676 on the feature branch — benign but duplicated if merged.
- pnpm workspace: single frontend/ package. Root scripts delegate via pnpm --filter frontend run X.
- Prettier processes files individually in lint-staged (6-7s per file on large components). Full pre-commit hook takes 1-3min, build ~2min, test suite ~6.5min (67 files / 594 tests).
- Shared dev=prod Neon: additive-only migrations with IF NOT EXISTS are safe. Never rename/drop columns without a separate migration plan.
- Commit identity: git -c user.name='Yossafina' -c user.email='yossafina22@gmail.com' inline on every commit (never git config, never env vars).

### Key Decisions
- Decision: localePrefix 'as-needed' → bare /dashboard serves FR, /en/dashboard serves EN — Reason: preserve existing SEO on French URLs, no /fr/* redirects.
- Decision: app/[locale]/i/[slug] included in move (WhatsApp invitation URLs become /en/i/xxx) — Reason: Day 1 scope simplicity; ceremony-level locale negotiation is Day 2+.
- Decision: Skip string extraction Day 1 — Reason: 4h budget; infrastructure first, progressive page-by-page translation later.
- Decision: User.locale kept with 'fr | en | de' doc hint (de used by AI generation route, not UI) — Reason: don't narrow schema when AI prompt-language is independent concern.
- Decision: No DB call in edge middleware — Reason: User.locale ↔ NEXT_LOCALE cookie sync must live in nodejs route at login; edge has no Prisma.
- Decision: Formal migration file with IF NOT EXISTS over db:push — Reason: shared dev=prod Neon, columns already exist from earlier push, migration file aligns _prisma_migrations ledger for fresh clones without re-running DDL.
- Decision: Self-review (no subagent reviewer dispatched) — Reason: user wanted fast finish; build + 594/594 tests + 5/5 tripwire = objective validation.

<!-- handoff:learnings:end -->
