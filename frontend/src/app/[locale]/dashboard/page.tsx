'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { CeremonyCard } from '@/components/CeremonyCard';
import { RSVPStatusBar } from '@/components/RSVPStatusBar';
import { AlertBanner } from '@/components/AlertBanner';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type CeremonyCardType = 'mariage' | 'bapteme' | 'anniversaire' | 'deuil' | 'coutumier';

interface Occasion {
  id: string;
  startsAt: string;
  locationName: string;
  locationAddress: string;
}

interface Ceremony {
  id: string;
  type: string;
  title: string;
  status: string;
  coverImageUrl: string | null;
  occasions: Occasion[];
  _count?: { guests: number; invitations: number };
}

interface DashboardStats {
  tier: 'FREEMIUM' | 'PREMIUM' | 'VIP';
  guestsTotal: number;
  guestsConfirmed: number;
  guestsDeclined: number;
  guestsPending: number;
  companions: number;
  invitationsTotal: number;
  aiCredits: {
    remaining: number;
    initial: number;
    unlimited: boolean;
  };
}

const TYPE_MAP: Record<string, CeremonyCardType> = {
  MARIAGE: 'mariage',
  BAPTEME: 'bapteme',
  ANNIVERSAIRE: 'anniversaire',
  DEUIL: 'deuil',
  AUTRE: 'coutumier',
};

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function daysBetween(target: Date): number {
  return Math.ceil((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

// TODO: wire RSVP + activity to real data once Invitation.rsvpStatus
// aggregation endpoint ships. Left hardcoded on purpose for now.
const ACTIVITY = [
  {
    icon: 'user-plus',
    text: 'Awa Camara a confirmé (+2)',
    time: 'il y a 5 min',
    color: 'text-success',
  },
  { icon: 'user-x', text: 'Mamadou Sy a décliné', time: 'il y a 1h', color: 'text-danger' },
  { icon: 'qr-code', text: '12 QR codes générés', time: 'hier', color: 'text-primary' },
  { icon: 'sparkles', text: 'Invitation modifiée par IA', time: 'hier', color: 'text-gold' },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ceremonies, setCeremonies] = useState<Ceremony[] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [ceremoniesRes, statsRes] = await Promise.allSettled([
        api<{ ceremonies: Ceremony[] }>('/api/ceremonies'),
        api<DashboardStats>('/api/dashboard/stats'),
      ]);
      if (cancelled) return;
      if (ceremoniesRes.status === 'fulfilled') {
        setCeremonies(ceremoniesRes.value.ceremonies);
      } else {
        setCeremonies([]);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  const firstName = user.email.split('@')[0]?.split('.')[0] ?? '';
  const capitalized = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : '';

  const activeCeremonies =
    ceremonies?.filter((c) => c.status === 'DRAFT' || c.status === 'ACTIVE') ?? [];
  const visibleCeremonies = (ceremonies ?? []).slice(0, 2);
  const nextCeremony = activeCeremonies
    .map((c) => ({
      c,
      daysLeft: c.occasions[0]
        ? daysBetween(new Date(c.occasions[0].startsAt))
        : Number.POSITIVE_INFINITY,
    }))
    .filter(({ daysLeft }) => daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0];
  const tagline = nextCeremony
    ? `Votre prochaine cérémonie est dans ${nextCeremony.daysLeft} jour${nextCeremony.daysLeft > 1 ? 's' : ''}. Tout roule !`
    : 'Aucune cérémonie à venir. Créez-en une pour commencer.';

  return (
    <AppLayout pageTitle="Tableau de bord" tier="premium">
      <div className="mb-5">
        <AlertBanner
          type="upgrade"
          message="Passez en VIP pour débloquer le suivi budget et la coordination prestataires."
          cta="Voir le plan VIP"
          href="/#pricing"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headings font-bold text-xl md:text-2xl text-foreground">
            Bonjour, {capitalized} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{tagline}</p>
        </div>
        <Link
          href="/ceremonies/new"
          className="bg-primary text-primary-foreground font-body font-bold px-4 md:px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Icon name="plus" size={16} />
          Nouvelle cérémonie
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard
          label="Cérémonies actives"
          value={ceremonies === null ? '…' : String(activeCeremonies.length)}
          icon="calendar-heart"
          color="primary"
          sub={ceremonies === null ? 'Chargement…' : `${ceremonies.length} au total`}
        />
        <StatCard
          label="Invités confirmés"
          value={stats === null ? '…' : String(stats.guestsConfirmed)}
          icon="user-check"
          color="success"
          sub={
            stats === null
              ? 'Chargement…'
              : stats.guestsTotal === 0
                ? 'Aucun invité encore'
                : `sur ${stats.guestsTotal} invité${stats.guestsTotal > 1 ? 's' : ''}${stats.companions > 0 ? ` (+${stats.companions} accomp.)` : ''}`
          }
        />
        <StatCard
          label="RSVP en attente"
          value={stats === null ? '…' : String(stats.guestsPending)}
          icon="clock"
          color="gold"
          sub={
            stats === null
              ? 'Chargement…'
              : stats.guestsPending === 0
                ? 'Tout le monde a répondu'
                : 'relance automatique possible'
          }
        />
        <StatCard
          label="Crédits IA restants"
          value={
            stats === null
              ? '…'
              : stats.aiCredits.unlimited
                ? '∞'
                : String(stats.aiCredits.remaining)
          }
          icon="sparkles"
          color="muted"
          sub={
            stats === null
              ? 'Chargement…'
              : stats.aiCredits.unlimited
                ? `illimité (${stats.tier})`
                : `sur ${stats.aiCredits.initial} (${stats.tier === 'FREEMIUM' ? 'Freemium' : stats.tier === 'PREMIUM' ? 'Premium' : 'VIP'})`
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headings font-bold text-lg text-foreground">Mes cérémonies</h3>
            <Link href="/ceremonies" className="text-sm text-primary font-medium">
              Tout voir
            </Link>
          </div>
          {ceremonies === null ? (
            <>
              {[0, 1].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                  <div className="h-5 w-2/3 bg-muted rounded mb-3" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </div>
              ))}
            </>
          ) : visibleCeremonies.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
              <div className="text-4xl mb-3 opacity-40">💍</div>
              <h4 className="font-headings font-bold text-base text-foreground mb-1">
                Aucune cérémonie pour l&apos;instant
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre première cérémonie.
              </p>
              <Link
                href="/ceremonies/new"
                className="inline-block bg-primary text-primary-foreground font-body font-bold px-5 py-2.5 rounded-lg text-sm"
              >
                Créer ma cérémonie
              </Link>
            </div>
          ) : (
            visibleCeremonies.map((c) => {
              const occ = c.occasions[0];
              const daysLeft = occ ? daysBetween(new Date(occ.startsAt)) : 0;
              return (
                <CeremonyCard
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  type={TYPE_MAP[c.type] ?? 'coutumier'}
                  date={occ ? DATE_FMT.format(new Date(occ.startsAt)) : '—'}
                  location={occ?.locationName ?? '—'}
                  guestsConfirmed={0}
                  guestsTotal={c._count?.guests ?? 0}
                  daysLeft={daysLeft}
                  coverImageUrl={c.coverImageUrl}
                />
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-headings font-bold text-base text-foreground mb-4">
              Statut RSVP global
            </h3>
            {stats === null ? (
              <div className="h-10 bg-muted rounded animate-pulse" />
            ) : stats.guestsTotal === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ajoutez des invités pour voir vos RSVP apparaître ici.
              </p>
            ) : (
              <RSVPStatusBar
                confirmed={stats.guestsConfirmed}
                declined={stats.guestsDeclined}
                pending={stats.guestsPending}
                total={stats.guestsTotal}
              />
            )}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1">Accompagnants</div>
              <div className="font-headings font-bold text-xl text-foreground">
                +{stats?.companions ?? 0}{' '}
                <span className="text-sm text-muted-foreground font-body">
                  personne{(stats?.companions ?? 0) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-headings font-bold text-base text-foreground mb-4">
              Activité récente
            </h3>
            <ul className="flex flex-col gap-3">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 ${a.color}`}
                  >
                    <Icon name={a.icon} size={11} />
                  </div>
                  <div className="flex-1 text-xs text-foreground">{a.text}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
