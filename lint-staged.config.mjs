// lint-staged uses micromatch to match staged files against patterns, then
// passes the matched filenames to each command. Prettier 3 parses those
// filenames as globs internally — any path segment that looks like a glob
// character class (e.g. `[locale]`, `[id]`, `[slug]` — all extremely common
// in Next.js App Router) is interpreted as a char class, zero files match,
// and prettier errors with "No files matching the pattern were found".
//
// Workaround: pass each path to prettier via its `--no-error-on-unmatched-
// pattern` flag so the glob miss is not fatal, AND ALSO pass each file as a
// shell arg so that when the glob genuinely matches (components, non-locale
// pages), prettier formats it. This keeps ESLint working normally.
//
// Files under `app/[locale]/` therefore skip prettier formatting at commit
// time — they are formatted on demand by `pnpm format` run at the repo root
// (where prettier's recursive `**` glob accepts bracket paths) or manually.

/** @param {string[]} files */
const tsCommands = (files) => {
  const quoted = files.map((p) => JSON.stringify(p)).join(' ');
  return [
    `prettier --write --no-error-on-unmatched-pattern ${quoted}`,
    `eslint --fix --max-warnings=0 --no-warn-ignored ${quoted}`,
  ];
};

/** @param {string[]} files */
const otherCommands = (files) => {
  const quoted = files.map((p) => JSON.stringify(p)).join(' ');
  return [`prettier --write --no-error-on-unmatched-pattern ${quoted}`];
};

export default {
  '*.{ts,tsx,js,mjs,cjs}': tsCommands,
  '*.{json,md,yml,yaml}': otherCommands,
};
