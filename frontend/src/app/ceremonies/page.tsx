'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';

interface Occasion {
  id: string;
  label: string;
  startsAt: string;
  locationName: string;
  locationAddress: string;
}

interface Ceremony {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
  occasions: Occasion[];
  _count?: { guests: number; invitations: number };
}

type Status = 'loading' | 'ready' | 'unauth' | 'error';

const CEREMONY_EMOJI: Record<string, string> = {
  MARIAGE: '💍',
  BAPTEME: '🕊️',
  ANNIVERSAIRE: '🎂',
  DEUIL: '🕯️',
  AUTRE: '✨',
};

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export default function CeremoniesListPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await api<{ ceremonies: Ceremony[] }>('/api/ceremonies');
      setCeremonies(res.ceremonies);
      setStatus('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStatus('unauth');
      } else {
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  async function handleQuickCreate() {
    setCreating(true);
    setErrorMsg(null);
    try {
      const now = new Date();
      const inThreeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      await api('/api/ceremonies', {
        method: 'POST',
        body: {
          type: 'MARIAGE',
          title: 'Mariage de démonstration',
          description:
            'Cérémonie de démonstration créée depuis la page liste — remplacez-la par une vraie cérémonie via le wizard.',
          occasions: [
            {
              label: 'Cérémonie principale',
              startsAt: inThreeMonths.toISOString(),
              locationName: 'Hôtel Terrou-Bi',
              locationAddress: 'Boulevard Martin Luther King, Dakar, Sénégal',
            },
          ],
        },
      });
      await refetch();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: unknown } | undefined;
        setErrorMsg(typeof body?.message === 'string' ? body.message : err.message);
      } else {
        setErrorMsg('Impossible de créer la cérémonie.');
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppLayout pageTitle="Mes cérémonies" tier="premium">
      {status === 'unauth' && <PreviewBanner />}

      <PageHeader
        title="Mes cérémonies"
        subtitle={
          status === 'loading'
            ? 'Chargement…'
            : status === 'unauth'
              ? 'Connectez-vous pour voir vos cérémonies'
              : `${ceremonies.length} cérémonie${ceremonies.length > 1 ? 's' : ''}`
        }
      >
        <Link
          href="/ceremonies/new"
          className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Icon name="plus" size={14} />
          <span className="hidden sm:inline">Nouvelle cérémonie</span>
          <span className="sm:hidden">Nouvelle</span>
        </Link>
      </PageHeader>

      {status === 'loading' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-muted rounded mb-3" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : status === 'unauth' ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3 opacity-40">🔒</div>
          <p className="text-sm text-muted-foreground mb-4">
            Vous devez être connecté pour accéder à vos cérémonies.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-primary text-primary-foreground font-body font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            Se connecter
          </Link>
        </div>
      ) : status === 'error' ? (
        <div className="bg-card border border-danger/40 rounded-xl p-6 text-center">
          <p className="text-sm text-danger mb-3">Impossible de charger vos cérémonies.</p>
          <button
            type="button"
            onClick={() => {
              setStatus('loading');
              void refetch();
            }}
            className="text-sm text-primary font-bold hover:underline"
          >
            Réessayer
          </button>
        </div>
      ) : ceremonies.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3 opacity-40">💍</div>
          <h3 className="font-headings font-bold text-base text-foreground mb-1">
            Aucune cérémonie pour l&apos;instant
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Créez votre première cérémonie depuis le wizard ou générez une cérémonie de
            démonstration pour tester l&apos;app.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/ceremonies/new"
              className="bg-primary text-primary-foreground font-body font-bold px-5 py-2.5 rounded-lg text-sm w-full sm:w-auto"
            >
              Créer ma cérémonie
            </Link>
            <button
              type="button"
              onClick={handleQuickCreate}
              disabled={creating}
              className="bg-secondary text-secondary-foreground font-body font-medium px-5 py-2.5 rounded-lg text-sm w-full sm:w-auto disabled:opacity-50"
            >
              {creating ? 'Création…' : 'Créer une démo rapide'}
            </button>
          </div>
          {errorMsg && <p className="text-xs text-danger mt-4">{errorMsg}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ceremonies.map((c) => (
            <Link
              key={c.id}
              href={`/ceremonies/${c.id}/editor`}
              className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="text-2xl mb-1">{CEREMONY_EMOJI[c.type] ?? '✨'}</div>
                  <h3 className="font-headings font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                </div>
                <span
                  className={`text-[11px] font-body font-bold px-2 py-1 rounded-md shrink-0 ${
                    c.status === 'ACTIVE'
                      ? 'bg-success-light text-success'
                      : c.status === 'DRAFT'
                        ? 'bg-gold-light text-gold'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {c.status}
                </span>
              </div>
              {c.occasions[0] && (
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Icon name="calendar" size={12} />
                  {DATE_FMT.format(new Date(c.occasions[0].startsAt))}
                </div>
              )}
              {c.occasions[0] && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon name="map-pin" size={12} />
                  <span className="truncate">{c.occasions[0].locationName}</span>
                </div>
              )}
              {c._count && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span>
                    {c._count.guests} invité{c._count.guests > 1 ? 's' : ''}
                  </span>
                  <span>
                    {c._count.invitations} envoyée{c._count.invitations > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
