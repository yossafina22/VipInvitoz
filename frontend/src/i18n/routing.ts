// Locale routing config consumed by the next-intl middleware (edge runtime) and
// the server-side request config. Day 1 scope: FR default + EN only. German
// ('de') appears as a documentation hint on the `User.locale` column because
// the AI generation route accepts it as a prompt-language hint; it is NOT a
// supported UI locale yet and must not be added here without also adding
// messages/de.json and updating the <html lang> test.
//
// Day 2+ will sync the authenticated user's `User.locale` DB column with the
// `NEXT_LOCALE` cookie. DO NOT introduce a Prisma call into this file or into
// any middleware consumer — middleware runs on edge (no Prisma, no DB client).
// The sync must happen in a Route Handler (nodejs runtime) at login/signup.

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'] as const,
  defaultLocale: 'fr',
  localePrefix: 'as-needed',
});

export type AppLocale = (typeof routing.locales)[number];
