# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Vercel Pro ($20/mo) required for this project: Hobby forbids commercial SaaS + 10s function timeout kills 15-30s Anthropic calls + Hobby cron floor is daily
- Neon DB shared dev=prod via single DATABASE_URL in .env.local + Vercel env vars — pnpm db:push immediately affects prod; safe for additive changes, risky for renames/drops
- Palette IDs are Prisma String not enum — adding presets needs no migration, just new INVITATION_PALETTES entry
- Phone camera photos 5-15 MB routinely exceed server 10 MB default — client-side downscale is required, not optional
- ESLint flat config has NO react-hooks/exhaustive-deps rule — never use disable-comments naming it
- UPLOAD_ALLOWED_MIME read at handler-call time in /api/upload/route.ts → Vercel env changes take effect on next invocation without redeploy; but .env.example tripwires in env-shape.test.ts assert stock 3-MIME default → override in Vercel env vars, NOT in .env.example
- Scratchpad DB scripts pattern: mirror refund-credits.ts shape, live under C:\Users\PC\AppData\Local\Temp\claude\<session>\scratchpad\
- DEUIL ceremonies locked to noir-minimal palette server-side via coercePaletteForType — never trust client-only enforcement

### Key Decisions
- Decision: Vercel Pro $20/mo — Reason: Hobby forbids commercial SaaS + 10s timeout kills Anthropic AI calls (15-30s) + Hobby cron floor is daily (delays verification emails up to 24h)
- Decision: Ship palette feature all-in-one (Prisma column + 5 presets + picker + preview + public page) — Reason: user chose 'Option simple' over decomposed ceremonyTone-first path
- Decision: Palette lives in editor with smart auto-default per ceremony type + free override + server-side DEUIL lock via coercePaletteForType — Reason: each ceremony has its own tone, settings page would force global choice
- Decision: 5 palette IDs stored as Prisma String (not enum) — Reason: adding new presets requires no DB migration
- Decision: Client-side downscale in lib/upload-client.ts before FormData append (canvas 2000px max, JPEG q=0.85, skip HEIC/HEIF→server handles via heic-convert) — Reason: phone photos routinely 5-15 MB, exceeded default 10 MB server cap
- Decision: Shared Neon DB between dev and prod (Option A) — Reason: solo-dev MVP speed; additive schema changes (new column with @default) safe, renames/drops risky
- Decision: Narrow i18n from FR/EN/DE (original PRD) to FR/EN only — Reason: user call to cut scope
- Decision: Close mobile drawer via per-Link onClick rather than useEffect(pathname) — Reason: react-hooks/exhaustive-deps rule not configured in flat ESLint, disable-comment itself errored

<!-- handoff:learnings:end -->
