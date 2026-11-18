// Server-side request config consumed by next-intl. Resolves the request's
// locale against the routing allowlist, falling back to the default locale if
// an unknown value is passed (e.g. a stale cookie). Messages are loaded from
// frontend/messages/<locale>.json via static imports so Turbopack bundles them
// at build time instead of resolving dynamically at edge request time.

import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing, type AppLocale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: AppLocale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return { locale, messages };
});
