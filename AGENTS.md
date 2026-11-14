# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Prod URL https://vip-invitoz.vercel.app — team fluxiateam, project vip-invitoz. Vercel settings page at https://vercel.com/fluxiateam/vip-invitoz/settings/environment-variables
- Vercel plan: Pro ($20/mo). Cron freq down to */1 allowed, function timeout 60s, commercial TOS allowed
- Resend sandbox: only yossafina22@gmail.com receives real emails in prod. Custom domain needs verifying at resend.com/domains
- DEV_EMAIL_BYPASS must NOT be set in Vercel — its presence routes emails to console instead of Resend
- Cron routes all POST + require Authorization: Bearer <CRON_SECRET>. Vercel native cron sends the header automatically
- Auto Mode classifier blocks any log/echo of API-credential prefixes or lengths — even safe truncations are denied as Credential Materialization. Debug via user-side env var Edit + compare, not via server logs
- Cloudinary CLOUDINARY_CLOUD_NAME=vipinvitoz (10 chars), CLOUDINARY_API_KEY=15 digits, CLOUDINARY_API_SECRET=27 chars mixed. Vercel's env-var popup PLACEHOLDER TEXT (cloudinary://1234...:aBcDe...@mycloud) is a saved value by default — users mistake it for help text; always clear + repaste real value
- Prisma db:push against shared dev=prod Neon is safe for additive columns with @default but risky for renames/drops. Prefer migrations for schema-breaking changes
- Git identity per commit via env vars (NEVER git config): GIT_AUTHOR_NAME='Yossafina' GIT_AUTHOR_EMAIL='yossafina22@gmail.com' GIT_COMMITTER_NAME='Yossafina' GIT_COMMITTER_EMAIL='yossafina22@gmail.com'
- Pre-commit hook runs prettier + eslint + typecheck + 555 tests (1-3 min). Hook rejects any eslint disable-comment that names a rule not registered in the flat config (react-hooks/exhaustive-deps is NOT registered)
- Images displayed via plain <img> — @next/next/no-img-element is NOT configured
- Phone camera photos commonly 5-15MB; upload-client.ts downscale handles the overflow without needing server-side body-limit tuning
- CRLF warnings on Windows during commit are benign (git handles conversion)

### Key Decisions
- Decision: Palette lives in editor with smart auto-default from ceremony.type (not a Settings-page global) — Reason: per-ceremony choice; mariage-and-deuil in same account shouldn't share a palette
- Decision: DEUIL ceremonies get a locked mourning subset (noir-minimal + faire-part-classique) enforced at API via coercePaletteForType, not client alone — Reason: defense in depth, a tampered client cannot slip a festive palette on a mourning invitation
- Decision: Catalog sized to 10 (2 rows of 5 on desktop) — Reason: user asked to fill remaining picker space after seeing 9-tile asymmetry on lg
- Decision: Client-side downscale to 2000px JPEG q=0.85 for files >1.5MB (HEIC/HEIF bypass canvas, go to server heic-convert) — Reason: iPhone photos 5-15MB routinely exceed server 10MB cap; downscale brings them to ~600KB without visible loss at invitation card size
- Decision: Echo Cloudinary rejection text back to client via UPLOAD_FAILED response.message instead of generic 'Storage write failed' — Reason: 401/403/429/5xx look identical on the wire; operator needs the real reason to fix env var typos in under a minute
- Decision: Prisma db:push rather than migration — Reason: shared dev=prod Neon, additive-only column with @default, no renames or drops, zero downtime risk

<!-- handoff:learnings:end -->
