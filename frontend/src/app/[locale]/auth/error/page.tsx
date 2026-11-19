// /auth/error — landing page for OAuth callback failures.
//
// The callback (frontend/src/app/api/auth/oauth/google/callback/route.ts)
// builds redirects via `redirectToAuthError(code)` in
// frontend/src/lib/server/oauth/error-redirect.ts. That helper hard-codes
// `/auth/error?code=<CODE>` with five UPPERCASE codes (D-06 contract):
//   GOOGLE_EMAIL_NOT_VERIFIED
//   OAUTH_STATE_MISMATCH
//   OAUTH_CODE_EXCHANGE_FAILED
//   OAUTH_PROVIDER_DISABLED
//   OAUTH_GENERIC
//
// Unknown / missing codes fall back to a generic message.
'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';

const KNOWN_CODES = [
  'GOOGLE_EMAIL_NOT_VERIFIED',
  'OAUTH_STATE_MISMATCH',
  'OAUTH_CODE_EXCHANGE_FAILED',
  'OAUTH_PROVIDER_DISABLED',
  'OAUTH_GENERIC',
] as const;

type KnownCode = (typeof KNOWN_CODES)[number];

function isKnownCode(code: string): code is KnownCode {
  return (KNOWN_CODES as readonly string[]).includes(code);
}

function AuthErrorBody() {
  const params = useSearchParams();
  const t = useTranslations('auth.error');
  const code = params.get('code') ?? params.get('error') ?? '';
  const normalized = code.toUpperCase();
  const message = isKnownCode(normalized) ? t(`codes.${normalized}`) : t('codeUnknown');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-sm text-gray-700">{message}</p>
      {code && (
        <p className="font-mono text-xs text-gray-400">
          {t('codePrefix')} {code}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Link
          href="/auth/login"
          className="rounded-md bg-black px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-gray-800"
        >
          {t('backToLogin')}
        </Link>
        <Link href="/" className="text-center text-sm text-gray-600 underline">
          {t('home')}
        </Link>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <AuthErrorBody />
    </Suspense>
  );
}
