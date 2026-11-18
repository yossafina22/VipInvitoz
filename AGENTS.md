# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Vercel Cron Jobs sends HTTP GET to configured paths (NOT POST). Route handlers MUST export GET or alias POST as GET, else every tick returns 405 silently and nothing drains
- Vercel env var Secret type hides the saved value in the Edit popup (shows empty Value field). Users mistake this for 'unset'. For non-sensitive config use Config type, OR delete the var entirely and let code defaults win
- Pre-commit hook (husky + lint-staged) runs prettier + eslint + typecheck repo-wide, not just on staged files. With 20+ WIP files on feat branch, typecheck takes 3-5 min — do not TaskStop early, wait it out
- EMAIL_FROM is the canonical env var name for the email queue sender. NOT RESEND_FROM_EMAIL, NOT RESEND_EMAIL_FROM. Required by email-queue-singleton.ts along with UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN + RESEND_API_KEY
- Windows + OneDrive-backed repo: find, ls -R, git worktree remove, ln -s are all slow or hang past 60s. Prefer Glob/Grep over find; skip worktree gymnastics; use stash+switch for branch moves
- Git identity per commit via env vars (NEVER git config): GIT_AUTHOR_NAME='Yossafina' GIT_AUTHOR_EMAIL='yossafina22@gmail.com' GIT_COMMITTER_NAME='Yossafina' GIT_COMMITTER_EMAIL='yossafina22@gmail.com'. MUST prefix the git commit command directly — chained after && in a compound does not carry env to the second command
- All 6 cron handlers go through verifyCronSecret (crypto.timingSafeEqual against CRON_SECRET env). Vercel cron automatically attaches Authorization: Bearer ${CRON_SECRET}. Local curl testing needs the same bearer header
- Resend sandbox: only the account owner's verified email receives in prod. x-resend-monthly-quota + x-resend-daily-quota response headers tell you remaining sends; verify custom domain at resend.com/domains to escape sandbox
- Auto Mode classifier blocks any log/echo of API-credential prefixes or lengths — even safe truncations are denied as Credential Materialization. Debug via user-side env var Edit + delete+recreate, not via server logs

### Key Decisions
- Decision: Alias POST as GET in all 6 cron routes rather than rename POST→GET or duplicate handlers — Reason: preserves existing POST tests + manual curl workflow, zero regression risk, one line per file
- Decision: Display cover photo at natural ratio (block w-full h-auto) in both guest pages and editor preview — Reason: user wanted full photo visible without any crop or blur, Instagram/Pinterest-style card that adapts to the photo not the other way around
- Decision: Include image/heic + image/heif in the default UPLOAD_ALLOWED_MIME so iPhone uploads work without env var override — Reason: iPhone is dominant user cohort; defaults should Just Work out of the box
- Decision: Infer MIME from file extension server-side when browser sends empty or application/octet-stream, then use inferred MIME for allowlist + sniff + storage — Reason: Windows Edge/Chrome without HEIF extension ships HEIC files with wrong MIME; magic-byte sniff remains the trust boundary so attacker renaming evil.exe→cute.heic is still blocked
- Decision: Delete UPLOAD_ALLOWED_MIME env var on Vercel entirely instead of editing it — Reason: lets code default win forever, avoids maintaining the mime list in two places
- Decision: Fix cron issue this session (option A) rather than defer and keep draining manually (option B) — Reason: manual drain script was unsustainable for daily operations + December launch deadline

<!-- handoff:learnings:end -->
