'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Image } from '@/components/Image';

type RSVPStatus = 'idle' | 'confirmed' | 'declined';
type Status = 'loading' | 'ready' | 'not-found' | 'error';

interface InvitationResponse {
  invitation: {
    slug: string;
    rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
    companionCount: number;
  };
  guest: { name: string };
  ceremony: {
    id: string;
    type: string;
    title: string;
    description: string;
    coverImageUrl: string | null;
    musicLabel: string | null;
  };
  occasions: Array<{
    id: string;
    label: string;
    startsAt: string;
    locationName: string;
    locationAddress: string;
    instructions: string | null;
  }>;
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

const TIME_FMT = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
});

export default function GuestInvitationPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<InvitationResponse | null>(null);
  const [rsvp, setRsvp] = useState<RSVPStatus>('idle');
  const [guests, setGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [savedGuests, setSavedGuests] = useState(1);
  const [companionsSaved, setCompanionsSaved] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/invitations/${slug}`, { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setStatus(res.status === 404 ? 'not-found' : 'error');
          return;
        }
        const json: InvitationResponse = await res.json();
        if (cancelled) return;
        setData(json);
        setStatus('ready');
        const serverStatus = json.invitation.rsvpStatus;
        setRsvp(
          serverStatus === 'CONFIRMED'
            ? 'confirmed'
            : serverStatus === 'DECLINED'
              ? 'declined'
              : 'idle',
        );
        const initialGuests = json.invitation.companionCount + 1;
        if (json.invitation.companionCount > 0) {
          setGuests(initialGuests);
        }
        setSavedGuests(initialGuests);
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function submitRsvp(choice: 'CONFIRMED' | 'DECLINED') {
    if (!slug || submitting) return;
    setSubmitting(true);
    try {
      const body: { status: 'CONFIRMED' | 'DECLINED'; companionCount?: number } = {
        status: choice,
      };
      if (choice === 'CONFIRMED') body.companionCount = Math.max(0, guests - 1);
      const res = await fetch(`/api/invitations/${slug}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setRsvp(choice === 'CONFIRMED' ? 'confirmed' : 'declined');
        if (choice === 'CONFIRMED') {
          setSavedGuests(guests);
          setCompanionsSaved(true);
          setTimeout(() => setCompanionsSaved(false), 2500);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-resubmit companion count after confirming if the guest changes it.
  // Debounced so rapid clicks on +1/+2/+3 coalesce into a single POST.
  useEffect(() => {
    if (rsvp !== 'confirmed') return;
    if (guests === savedGuests) return;
    const t = setTimeout(() => {
      void submitRsvp('CONFIRMED');
    }, 600);
    return () => clearTimeout(t);
  }, [guests, rsvp, savedGuests]);

  // Loading skeleton
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement de votre invitation…</p>
      </div>
    );
  }

  // Not found or error
  if (status !== 'ready' || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center">
          <div className="text-5xl mb-3 opacity-30">💌</div>
          <h1 className="font-headings font-bold text-xl mb-2">
            {status === 'not-found' ? 'Invitation introuvable' : 'Erreur de chargement'}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            {status === 'not-found'
              ? 'Le lien de cette invitation est invalide ou a été révoqué.'
              : 'Impossible de charger l’invitation. Veuillez réessayer dans un instant.'}
          </p>
          <Link href="/" className="text-primary font-bold text-sm">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    );
  }

  const { ceremony, guest, occasions } = data;
  const firstOcc = occasions[0];
  const emoji = CEREMONY_EMOJI[ceremony.type] ?? '✨';

  return (
    <div className="bg-background font-body min-h-screen pb-6">
      {/* Header */}
      <div className="bg-dark-surface px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-primary-foreground" aria-label="Retour">
          <Icon name="arrow-left" size={18} />
        </Link>
        <div className="text-xs text-gold font-bold tracking-widest">INVITATION</div>
        <button type="button" className="text-primary-foreground" aria-label="Partager">
          <Icon name="share-2" size={18} />
        </button>
      </div>

      <div className="max-w-md mx-auto lg:max-w-2xl">
        <div className="px-4 py-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="relative h-60 sm:h-72 lg:h-96 bg-input overflow-hidden">
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
                Cher·e {guest.name}
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

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => submitRsvp('CONFIRMED')}
                  disabled={submitting}
                  className={`text-sm font-body font-bold px-6 py-3 rounded-lg w-full transition-colors disabled:opacity-60 ${
                    rsvp === 'confirmed'
                      ? 'bg-success text-primary-foreground'
                      : 'bg-success text-primary-foreground hover:bg-success/90'
                  }`}
                >
                  {rsvp === 'confirmed' ? '✓ Présence confirmée' : '✓ Je confirme ma présence'}
                </button>
                <button
                  type="button"
                  onClick={() => submitRsvp('DECLINED')}
                  disabled={submitting}
                  className={`text-sm font-body font-bold px-4 py-3 rounded-lg transition-colors disabled:opacity-60 ${
                    rsvp === 'declined'
                      ? 'bg-danger text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {rsvp === 'declined' ? 'Absence enregistrée' : 'Je ne peux pas venir'}
                </button>
              </div>

              {ceremony.musicLabel && (
                <div className="mt-6 pt-6 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Icon name="music" size={12} />
                  <span>Musique : {ceremony.musicLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        {firstOcc && (
          <div className="px-4 pb-6">
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
            </div>
          </div>
        )}

        {/* Accompagnants */}
        {rsvp !== 'declined' && (
          <div className="px-4 pb-6">
            <div className="bg-secondary border border-border rounded-xl p-4">
              <div className="text-sm font-body font-bold text-secondary-foreground mb-3">
                Nombre d&apos;accompagnants
              </div>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGuests(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-body font-bold border transition-colors ${
                      n === guests
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-foreground hover:border-primary'
                    }`}
                  >
                    {n === 1 ? '+ Moi seul' : `+ ${n - 1}`}
                  </button>
                ))}
              </div>
              <div className="text-xs text-secondary-foreground">
                {rsvp === 'confirmed'
                  ? companionsSaved
                    ? '✓ Nombre d’accompagnants enregistré'
                    : guests !== savedGuests
                      ? 'Enregistrement…'
                      : 'Modifiez librement, l’enregistrement est automatique.'
                  : 'Indiquez combien de personnes vous accompagneront.'}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-4 pb-6">
          <button
            type="button"
            className="block w-full text-center bg-primary text-primary-foreground font-body font-bold py-3 rounded-lg text-sm"
          >
            Ajouter au calendrier
          </button>
          <div className="flex gap-2 mt-2">
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-secondary text-secondary-foreground font-body font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-1"
            >
              <Icon name="message-circle" size={12} />
              WhatsApp
            </a>
            <button
              type="button"
              className="flex-1 text-center bg-muted text-muted-foreground font-body font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-1"
            >
              <Icon name="share-2" size={12} />
              Partager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
