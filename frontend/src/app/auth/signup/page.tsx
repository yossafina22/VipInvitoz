'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { api, ApiError } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
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
        setError(err.message || 'Impossible de créer le compte. Vérifiez vos informations.');
      } else {
        setError('Erreur réseau. Réessayez.');
      }
      setLoading(false);
    }
  };

  return (
    <AuthShell
      active="signup"
      title="Bienvenue sur VipInvitoz"
      subtitle="Créez votre compte pour commencer à organiser vos cérémonies."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          name="name"
          label="Prénom & Nom"
          placeholder="Ex: Fatoumata Diallo"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
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
          placeholder="Minimum 8 caractères"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          hint="Au moins 8 caractères, avec une majuscule et un chiffre."
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
          {loading ? 'Création…' : 'Créer mon compte →'}
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/legal/terms" className="text-primary">
            CGU
          </Link>{' '}
          et notre{' '}
          <Link href="/legal/privacy" className="text-primary">
            Politique de confidentialité
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
