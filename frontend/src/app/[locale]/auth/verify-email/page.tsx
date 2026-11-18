'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { api, ApiError, storeCsrfToken } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface VerifyResponse {
  csrfToken?: string;
}

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const email = params.get('email') ?? '';
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<VerifyResponse>('/api/auth/verify-email', {
        method: 'POST',
        body: { email, code: code.trim().toUpperCase() },
      });
      if (res.csrfToken) storeCsrfToken(res.csrfToken);
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Code invalide ou expiré.');
      } else {
        setError('Erreur réseau. Réessayez.');
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendInfo(null);
    try {
      await api('/api/auth/resend-verification', { method: 'POST', body: { email } });
      setResendInfo('Un nouveau code vous a été envoyé par email.');
    } catch {
      setResendInfo("Nous n'avons pas pu renvoyer le code. Vérifiez l'adresse email.");
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <NavBar activePage="" />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="text-4xl text-center mb-4">📬</div>
          <h1 className="font-headings font-bold text-2xl md:text-3xl text-foreground text-center mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Nous avons envoyé un code à{' '}
            <strong className="text-foreground break-all">{email || 'votre adresse'}</strong>.
            Saisissez-le ci-dessous pour activer votre compte.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="code" className="text-sm font-body font-medium text-foreground">
              Code de vérification
              <span className="text-primary ml-1" aria-hidden>
                *
              </span>
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
              placeholder="XXXXXXXX"
              maxLength={8}
              autoComplete="one-time-code"
              required
              className="w-full bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-md px-3 py-3 text-center font-headings font-bold text-xl tracking-[0.3em] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            {resendInfo && <p className="text-sm text-success">{resendInfo}</p>}
            <button
              type="submit"
              disabled={loading || code.length < 8}
              className="bg-primary text-primary-foreground text-center font-body font-bold py-3.5 rounded-xl text-base disabled:opacity-50"
            >
              {loading ? 'Vérification…' : 'Vérifier mon email →'}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Vous n&apos;avez pas reçu le code ?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="text-primary font-body font-medium"
              >
                Renvoyer
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
