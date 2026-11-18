'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { api, ApiError, storeCsrfToken } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface LoginResponse {
  csrfToken?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      if (res.csrfToken) storeCsrfToken(res.csrfToken);
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Email ou mot de passe incorrect.');
      } else {
        setError('Erreur réseau. Réessayez.');
      }
      setLoading(false);
    }
  };

  return (
    <AuthShell
      active="login"
      title="Bon retour parmi nous"
      subtitle="Connectez-vous pour reprendre où vous en étiez."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          name="email"
          type="email"
          label="Email"
          placeholder="fatou@exemple.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <FormField
          name="password"
          type="password"
          label="Mot de passe"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        <div className="flex items-center justify-between -mt-1">
          <Link href="/auth/forgot-password" className="text-xs text-primary font-body font-medium">
            Mot de passe oublié ?
          </Link>
        </div>
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
          {loading ? 'Connexion…' : 'Se connecter →'}
        </button>
      </form>
    </AuthShell>
  );
}
