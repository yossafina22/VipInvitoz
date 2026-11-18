# AGENTS.md

<!-- handoff:learnings:begin -->
## Session Learnings (auto-updated by handoff)

### Implicit Rules
- Windows + OneDrive with core.autocrlf=true + prettier endOfLine:lf config creates false-positive format:check failures locally — the repo blobs are LF so CI (Linux) is unaffected; verify with 'git show HEAD:<path> | od -c | head' before touching 54 files
- CI gate is pnpm audit --prod --audit-level=high (added commit cf9d357, May 2026); dev-only advisories tolerated by design
- Auto Mode classifier blocks edits that suppress security checks without explicit user authorization — propose with AskUserQuestion or wait for explicit 'yes' in chat before retry
- picomatch@4.0.4 GHSA-fc5q-39xc-vjpf is a ReDoS with no upstream fix; it is a build-time dep (Rollup pattern-matching inside Sentry bundler), never receives user input in this project — accepting it as documented exception is defensible for an audit
- pnpm.overrides selector syntax 'name@<version': '>=version' only patches vulnerable versions, leaves compatible transitives alone — preferred over blanket override
- Pre-commit hook (husky + lint-staged) runs prettier + eslint + typecheck repo-wide; on Windows OneDrive takes 3-5 min — do not TaskStop early

### Key Decisions
- Decision: Chose Option 2 (surgical ignoreGhsas for picomatch) over Option 1 (relax audit-level=critical) and Option 3 (revert all bumps) — Reason: 5000-user app launching December cannot afford hidden CVE debt; documented single exception > blanket threshold relaxation that hides future high CVEs
- Decision: Kept @sentry/nextjs major bump 10→11 instead of pinning to 10.x — Reason: API surface used (Sentry.init + standard opts: dsn, environment, release, tracesSampleRate, sendDefaultPii, ignoreErrors, replaysSessionSampleRate) is stable across 7→8→9→10→11; build step will catch any bundler incompatibility
- Decision: pnpm.overrides with version-constrained keys (e.g. 'nanoid@<3.3.18': '>=3.3.18') instead of blanket overrides — Reason: only patches vulnerable versions, leaves compatible transitives alone

<!-- handoff:learnings:end -->
