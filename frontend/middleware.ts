import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// Composed middleware — order matters:
//   1. next-intl runs first: detects locale (cookie > Accept-Language > default),
//      redirects bare /dashboard → /dashboard (fr, as-needed) or /en/dashboard,
//      and sets the NEXT_LOCALE cookie.
//   2. Auth-refresh runs second on the locale-normalized path: if the user is
//      hitting a protected prefix without an access cookie but with a refresh
//      cookie, bounce through /api/auth/refresh-and-return. If no refresh
//      cookie either, redirect to <locale>/login so the UI language survives.
//
// Edge runtime: no DB, no bcrypt, no Prisma. Both inner middlewares inspect
// cookies and build redirects only.
//
// Day-1 note: the authed user's User.locale DB column is NOT read here
// (middleware runs on edge). Cookie + Accept-Language are the only inputs.
// Sync User.locale ↔ NEXT_LOCALE cookie in a nodejs route at login — Day 2+.

const COOKIE_PREFIX = process.env.COOKIE_PREFIX || 'app';
const ACCESS_COOKIE = `${COOKIE_PREFIX}-token`;
const REFRESH_COOKIE = `${COOKIE_PREFIX}-refresh`;
const LOGIN_PATH = process.env.AUTH_LOGIN_PATH || '/login';

const AUTHED_PREFIXES = (process.env.AUTH_PROTECTED_PREFIXES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const intlMiddleware = createMiddleware(routing);

function stripLocalePrefix(pathname: string): { locale: string | null; rest: string } {
  const segments = pathname.split('/');
  const first = segments[1];
  if (first && (routing.locales as readonly string[]).includes(first)) {
    return { locale: first, rest: '/' + segments.slice(2).join('/') };
  }
  return { locale: null, rest: pathname };
}

function isAuthedPath(pathname: string): boolean {
  return AUTHED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function withLocalePrefix(locale: string | null, pathname: string): string {
  if (!locale || locale === routing.defaultLocale) return pathname;
  return `/${locale}${pathname === '/' ? '' : pathname}`;
}

export function middleware(req: NextRequest): NextResponse {
  const intlResponse = intlMiddleware(req);

  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  if (AUTHED_PREFIXES.length === 0) return intlResponse;

  const { pathname, search } = req.nextUrl;
  const { locale, rest } = stripLocalePrefix(pathname);

  if (!isAuthedPath(rest)) return intlResponse;

  if (req.cookies.get(ACCESS_COOKIE)?.value) return intlResponse;

  const target = pathname + search;

  if (!req.cookies.get(REFRESH_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = withLocalePrefix(locale, LOGIN_PATH);
    url.search = `?next=${encodeURIComponent(target)}`;
    return NextResponse.redirect(url, 303);
  }

  const url = req.nextUrl.clone();
  url.pathname = '/api/auth/refresh-and-return';
  url.search = `?next=${encodeURIComponent(target)}`;
  return NextResponse.redirect(url, 303);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
