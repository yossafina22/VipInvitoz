// /settings — account-level controls.
//
// Two flows live here today:
//   1. Set / change password
//      - If the account was created via OAuth (hasPassword=false), the
//        "Set password" form calls POST /api/auth/set-password — no current
//        password required, because there isn't one.
//      - Otherwise the "Change password" form calls PUT /api/auth/change-password
//        with currentPassword + newPassword.
//   2. Link a provider (Google)
//      - When Google is not already linked, the button kicks the user to
//        GET /api/auth/oauth/google/start?next=/settings, which goes through
//        the normal OAuth dance and lands back on /settings linked.
//      - When already linked, we just show a "linked" pill — no unlink action
//        yet (would need a /api/auth/oauth/google/unlink endpoint with a
//        guard refusing to leave the user without any sign-in method).
'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth, useUser } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const KNOWN_PASSWORD_ERRORS = [
  'INVALID_CREDENTIALS',
  'PASSWORD_BANNED',
  'PASSWORD_TOO_SHORT',
  'PASSWORD_PWNED',
  'PASSWORD_ALREADY_SET',
  'VALIDATION_FAILED',
] as const;

type KnownPasswordError = (typeof KNOWN_PASSWORD_ERRORS)[number];

function isKnownPasswordError(code: string): code is KnownPasswordError {
  return (KNOWN_PASSWORD_ERRORS as readonly string[]).includes(code);
}

export default function SettingsPage() {
  const user = useUser();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('settings');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-2 px-4">
        <p className="text-sm text-gray-600">{t('loading')}</p>
      </main>
    );
  }

  const hasPassword = user.hasPassword;
  const googleLinked = user.linkedProviders.includes('google');

  async function onSubmitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length === 0) {
      setError(t('password.emptyError'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('password.mismatchError'));
      return;
    }

    setSubmitting(true);
    try {
      if (hasPassword) {
        await api('/api/auth/change-password', {
          method: 'PUT',
          body: { currentPassword, newPassword },
        });
        toast(t('password.successChange'), 'success');
      } else {
        await api('/api/auth/set-password', {
          method: 'POST',
          body: { newPassword },
        });
        toast(t('password.successSet'), 'success');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'PASSWORD_TOO_SHORT' && err.message) {
          // Server sometimes sends a dynamic min-length message — prefer it
          // over the generic translated fallback so the user sees the exact
          // threshold.
          setError(err.message);
        } else if (isKnownPasswordError(err.code)) {
          setError(t(`password.errors.${err.code}`));
        } else {
          setError(err.message);
        }
      } else {
        setError(t('password.networkError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-gray-600">{t('connectedAs', { email: user.email })}</p>
      </header>

      {/* ── Password section ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">
          {hasPassword ? t('password.changeTitle') : t('password.setTitle')}
        </h2>
        <p className="text-sm text-gray-600">
          {hasPassword ? t('password.changeDesc') : t('password.setDesc')}
        </p>
        <form onSubmit={onSubmitPassword} className="mt-2 flex flex-col gap-4">
          {hasPassword && (
            <label className="flex flex-col gap-1 text-sm">
              {t('password.currentLabel')}
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            {t('password.newLabel')}
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('password.confirmLabel')}
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting
              ? t('password.submitting')
              : hasPassword
                ? t('password.changeBtn')
                : t('password.setBtn')}
          </button>
        </form>
      </section>

      {/* ── Linked providers section ────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">{t('linked.title')}</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{t('linked.googleLabel')}</span>
            <span className="text-xs text-gray-500">
              {googleLinked ? t('linked.googleLinkedDesc') : t('linked.googleNotLinkedDesc')}
            </span>
          </div>
          {googleLinked ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {t('linked.linkedPill')}
            </span>
          ) : (
            <a
              href="/api/auth/oauth/google/start?next=/settings"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              {t('linked.linkGoogleBtn')}
            </a>
          )}
        </div>
      </section>

      <Link href="/dashboard" className="text-center text-sm text-gray-600 underline">
        {t('backToDashboard')}
      </Link>
    </main>
  );
}
