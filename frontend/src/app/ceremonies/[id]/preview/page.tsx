'use client';

// Organizer-only preview of /i/[slug]. Fetches the ceremony via the
// authenticated endpoint and renders the invitation exactly as a guest
// would see it, minus the RSVP buttons / state. No real slug, no guest
// touched, no companionCount persistence — this is a visual dry-run.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Image } from '@/components/Image';
import { QRCode } from '@/components/QRCode';
import { api, ApiError } from '@/lib/api';

interface Occasion {
  id: string;
  label: string;
  startsAt: string;
  locationName: string;
  locationAddress: string;
  instructions: string | null;
}

interface Ceremony {
  id: string;
  type: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  musicLabel: string | null;
  occasions: Occasion[];
}

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
const TIME_FMT = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export default function CeremonyPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ceremonyId = params.id;

  const [ceremony, setCeremony] = useState<Ceremony | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');

  useEffect(() => {
    if (!ceremonyId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api<{ ceremony: Ceremony }>(`/api/ceremonies/${ceremonyId}`);
        if (!cancelled) {
          setCeremony(res.ceremony);
          setStatus('ready');
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) router.replace('/auth/login');
        else if (err instanceof ApiError && err.status === 404) setStatus('not-found');
        else setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ceremonyId, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement de l’aperçu…</p>
      </div>
    );
  }

  if (status !== 'ready' || !ceremony) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <div className="text-5xl mb-3 opacity-30">💌</div>
          <h1 className="font-headings font-bold text-xl mb-2">
            {status === 'not-found' ? 'Cérémonie introuvable' : 'Erreur de chargement'}
          </h1>
          <Link href="/ceremonies" className="text-primary font-bold text-sm">
            Retour aux cérémonies
          </Link>
        </div>
      </div>
    );
  }

  const firstOcc = ceremony.occasions[0];
  const emoji = CEREMONY_EMOJI[ceremony.type] ?? '✨';
  const previewUrl =
    typeof window !== 'undefined' ? window.location.href : `/ceremonies/${ceremony.id}/preview`;

  return (
    <div className="bg-background font-body min-h-screen pb-6">
      {/* Preview-mode banner */}
      <div className="bg-gold text-background px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold">
        <Icon name="eye" size={12} />
        <span>Mode aperçu — vous voyez l’invitation comme vos invités la verront.</span>
      </div>

      {/* Header (same as /i/[slug]) */}
      <div className="bg-dark-surface px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link
          href={`/ceremonies/${ceremony.id}/editor`}
          className="text-primary-foreground"
          aria-label="Retour à l’éditeur"
        >
          <Icon name="arrow-left" size={18} />
        </Link>
        <div className="text-xs text-gold font-bold tracking-widest">INVITATION — APERÇU</div>
        <span aria-hidden className="w-[18px]" />
      </div>

      <div className="max-w-md mx-auto lg:max-w-5xl">
        <div className="px-4 py-6 lg:grid lg:grid-cols-5 lg:gap-6">
          {/* Main invitation card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden lg:col-span-3">
            <div className="relative bg-input overflow-hidden aspect-[4/3] lg:aspect-[16/10]">
              <Image
                ar="4:3"
                src={ceremony.coverImageUrl ?? '/banani/invitation-cover.jpg'}
                prompt={ceremony.title}
                className="w-full h-full"
                objectPosition="center 20%"
                priority
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background opacity-50"
                aria-hidden
              />
            </div>

            <div className="px-6 py-8 text-center">
              <div className="text-5xl mb-3">{emoji}</div>
              <div className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-3">
                Cher·e invité·e
              </div>
              <h2 className="font-headings font-bold text-2xl lg:text-3xl text-foreground mb-3 leading-tight">
                {ceremony.title}
              </h2>
              <p className="text-sm text-foreground opacity-80 mb-6 leading-relaxed">
                {ceremony.description}
              </p>

              {firstOcc && (
                <div className="flex justify-center items-stretch gap-3 lg:gap-4 mb-6 text-center">
                  {[
                    { label: 'Date', value: DATE_FMT.format(new Date(firstOcc.startsAt)) },
                    { label: 'Heure', value: TIME_FMT.format(new Date(firstOcc.startsAt)) },
                    { label: 'Lieu', value: firstOcc.locationName },
                  ].map((item, i, arr) => (
                    <div key={item.label} className="flex items-stretch gap-3 lg:gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                        <div className="font-body font-bold text-sm text-foreground">
                          {item.value}
                        </div>
                      </div>
                      {i < arr.length - 1 && <div className="w-px bg-border" aria-hidden />}
                    </div>
                  ))}
                </div>
              )}

              {/* RSVP buttons — disabled in preview */}
              <div className="mt-6 flex flex-col gap-2 opacity-60 pointer-events-none">
                <button
                  type="button"
                  disabled
                  className="text-sm font-body font-bold px-6 py-3 rounded-lg w-full bg-success text-primary-foreground"
                >
                  ✓ Je confirme ma présence
                </button>
                <button
                  type="button"
                  disabled
                  className="text-sm font-body font-bold px-4 py-3 rounded-lg bg-muted text-muted-foreground"
                >
                  Je ne peux pas venir
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground italic">
                (RSVP désactivé en mode aperçu)
              </p>

              {ceremony.musicLabel && (
                <div className="mt-6 pt-6 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Icon name="music" size={12} />
                  <span>Musique : {ceremony.musicLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="mt-4 lg:mt-0 lg:col-span-2 flex flex-col gap-4">
            {firstOcc && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Icon name="map-pin" size={14} className="text-primary mt-1 shrink-0" />
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-foreground mb-0.5">Lieu complet</div>
                    <div className="text-muted-foreground">{firstOcc.locationAddress}</div>
                  </div>
                </div>
                {firstOcc.instructions && (
                  <div className="flex items-start gap-3">
                    <Icon name="info" size={14} className="text-primary mt-1 shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-foreground mb-0.5">Indications</div>
                      <div className="text-muted-foreground">{firstOcc.instructions}</div>
                    </div>
                  </div>
                )}
                {ceremony.occasions.length > 1 && (
                  <div className="flex items-start gap-3 pt-3 border-t border-border">
                    <Icon name="calendar" size={14} className="text-primary mt-1 shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-foreground mb-1">Autres occasions</div>
                      <ul className="text-muted-foreground space-y-0.5">
                        {ceremony.occasions.slice(1).map((o) => (
                          <li key={o.id}>
                            {o.label} — {DATE_FMT.format(new Date(o.startsAt))}{' '}
                            {TIME_FMT.format(new Date(o.startsAt))} · {o.locationName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Accompagnants — disabled in preview */}
            <div className="bg-secondary border border-border rounded-xl p-4 opacity-60 pointer-events-none">
              <div className="text-sm font-body font-bold text-secondary-foreground mb-3">
                Nombre d&apos;accompagnants
              </div>
              <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled
                    className="flex-1 py-2 rounded-lg text-sm font-body font-bold border border-border text-foreground"
                  >
                    {n === 1 ? '+ Moi seul' : `+ ${n - 1}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3">
              <div className="text-sm font-body font-bold text-foreground">Aperçu du QR</div>
              <QRCode value={previewUrl} size={180} />
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Chaque invité aura son propre QR unique, encodant son lien personnel.
              </p>
            </div>

            <Link
              href={`/ceremonies/${ceremony.id}/editor`}
              className="block w-full text-center bg-primary text-primary-foreground font-body font-bold py-3 rounded-lg text-sm"
            >
              ← Retour à l’éditeur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
