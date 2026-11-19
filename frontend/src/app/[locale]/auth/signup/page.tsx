'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { api, ApiError } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations('auth.signup');
  const tCommon = useTranslations('auth.common');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api('/api/auth/signup', { method: 'POST', body: { email, password, name } });
      const query = new URLSearchParams({ email });
      router.push(`/auth/verify-email?${query.toString()}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || t('defaultError'));
      } else {
        setError(tCommon('networkError'));
      }
      setLoading(false);
    }
  };

  return (
    <AuthShell active="signup" title={t('title')} subtitle={t('subtitle')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          name="name"
          label={t('nameLabel')}
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <FormField
          name="email"
          type="email"
          label={tCommon('emailLabel')}
          placeholder={tCommon('emailPlaceholder')}
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <FormField
          name="password"
          type="password"
          label={tCommon('passwordLabel')}
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          hint={t('passwordHint')}
        />
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground text-center font-body font-bold py-3.5 rounded-xl text-base mt-2 disabled:opacity-50"
        >
          {loading ? t('submitLoading') : t('submit')}
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t.rich('termsAndPrivacy', {
            terms: (chunks) => (
              <Link href="/legal/terms" className="text-primary">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/legal/privacy" className="text-primary">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </form>
    </AuthShell>
  );
}
