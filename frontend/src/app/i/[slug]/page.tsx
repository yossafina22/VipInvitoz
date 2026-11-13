'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { QRCode } from '@/components/QRCode';
import { WaxPattern } from '@/components/WaxPattern';

type RSVPStatus = 'idle' | 'confirmed' | 'declined';
type Status = 'loading' | 'ready' | 'not-found' | 'error';

interface InvitationBlock {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'quote' | 'cta';
  text: string;
}
interface InvitationJson {
  palette: 'wax' | 'gold' | 'ivory' | 'indigo';
  blocks: InvitationBlock[];
}

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
    invitationJson: InvitationJson | null;
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
  const invitationUrl =
    typeof window !== 'undefined' ? window.location.href : `/i/${data.invitation.slug}`;

  function handleShare() {
    if (typeof window === 'undefined') return;
    const payload = {
      title: ceremony.title,
      text: `Vous êtes invité(e) à ${ceremony.title}`,
      url: invitationUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      void navigator.share(payload).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(invitationUrl);
    }
  }

  return (
    <div className="bg-background font-body min-h-screen pb-6">
      {/* Header */}
      <div className="bg-dark-surface px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-primary-foreground" aria-label="Retour">
          <Icon name="arrow-left" size={18} />
        </Link>
        <div className="text-xs text-gold font-bold tracking-widest">INVITATION</div>
        <button
          type="button"
          onClick={handleShare}
          className="text-primary-foreground"
          aria-label="Partager"
        >
          <Icon name="share-2" size={18} />
        </button>
      </div>

      <div className="max-w-md mx-auto lg:max-w-5xl">
        <div className="px-4 py-6 lg:grid lg:grid-cols-5 lg:gap-6">
          {/* Main invitation card — spans 3 cols on desktop */}
          <div className="relative bg-card border border-border rounded-2xl overflow-hidden lg:col-span-3 shadow-lg">
            {/* Decorative wax pattern across the whole card (very subtle) */}
            <WaxPattern opacity={0.035} />

            {/* Cover — full image shown (object-contain) with a blurred
                backdrop of itself to fill the aspect-ratio box elegantly. */}
            <div
              className="relative bg-input overflow-hidden aspect-[4/3] lg:aspect-[16/10]"
              style={
                ceremony.coverImageUrl
                  ? {
                      backgroundImage: `url(${ceremony.coverImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {ceremony.coverImageUrl && (
                <div className="absolute inset-0 backdrop-blur-2xl bg-background/30" aria-hidden />
              )}
              { }
              <img
                src={ceremony.coverImageUrl ?? '/banani/invitation-cover.jpg'}
                alt={ceremony.title}
                loading="eager"
                className="relative w-full h-full object-contain"
              />
            </div>

            <div className="relative px-6 py-10 text-center">
              {/* Emoji inside a gold-ringed circle */}
              <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-gold-light border-2 border-gold flex items-center justify-center text-4xl shadow-sm">
                {emoji}
              </div>

              <div className="text-[11px] font-body uppercase tracking-[0.25em] text-gold mb-3">
                Cher·e {guest.name}
              </div>

              {ceremony.invitationJson ? (
                <AiInvitationBody
                  invitation={ceremony.invitationJson}
                  fallbackTitle={ceremony.title}
                />
              ) : (
                <>
                  <h2 className="font-headings font-bold text-2xl lg:text-4xl text-foreground mb-3 leading-tight">
                    {ceremony.title}
                  </h2>
                  <div className="flex items-center justify-center gap-3 mb-5" aria-hidden>
                    <span className="h-px w-10 bg-gold/60" />
                    <span className="text-gold text-xs">◆</span>
                    <span className="h-px w-10 bg-gold/60" />
                  </div>
                  <p className="text-sm lg:text-base text-foreground/80 max-w-prose mx-auto mb-7 leading-relaxed italic">
                    {ceremony.description}
                  </p>
                </>
              )}

              {firstOcc && (
                <div className="grid grid-cols-3 gap-2 mb-8 max-w-md mx-auto">
                  {[
                    {
                      label: 'Date',
                      value: DATE_FMT.format(new Date(firstOcc.startsAt)),
                    },
                    {
                      label: 'Heure',
                      value: TIME_FMT.format(new Date(firstOcc.startsAt)),
                    },
                    { label: 'Lieu', value: firstOcc.locationName },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-gold-light/40 border border-gold/30 rounded-lg px-2 py-3"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">
                        {item.label}
                      </div>
                      <div className="font-body font-bold text-sm text-foreground leading-tight">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => submitRsvp('CONFIRMED')}
                  disabled={submitting}
                  className={`text-sm font-body font-bold px-6 py-3.5 rounded-full w-full transition-all disabled:opacity-60 shadow-sm ${
                    rsvp === 'confirmed'
                      ? 'bg-success text-primary-foreground ring-2 ring-success/30 ring-offset-2'
                      : 'bg-success text-primary-foreground hover:bg-success/90 hover:shadow-md'
                  }`}
                >
                  {rsvp === 'confirmed' ? '✓ Présence confirmée' : '✓ Je confirme ma présence'}
                </button>
                <button
                  type="button"
                  onClick={() => submitRsvp('DECLINED')}
                  disabled={submitting}
                  className={`text-sm font-body px-4 py-2.5 rounded-full transition-colors disabled:opacity-60 ${
                    rsvp === 'declined'
                      ? 'bg-danger/10 text-danger border border-danger/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {rsvp === 'declined' ? 'Absence enregistrée' : 'Je ne peux pas venir'}
                </button>
              </div>

              {ceremony.musicLabel && (
                <div className="mt-8 pt-6 border-t border-gold/20 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Icon name="music" size={12} className="text-gold" />
                  <span>Musique : {ceremony.musicLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right column — details + accompagnants + QR + CTA */}
          <div className="mt-4 lg:mt-0 lg:col-span-2 flex flex-col gap-4">
            {/* Details */}
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
                {occasions.length > 1 && (
                  <div className="flex items-start gap-3 pt-3 border-t border-border">
                    <Icon name="calendar" size={14} className="text-primary mt-1 shrink-0" />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-foreground mb-1">Autres occasions</div>
                      <ul className="text-muted-foreground space-y-0.5">
                        {occasions.slice(1).map((o) => (
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

            {/* Accompagnants */}
            {rsvp !== 'declined' && (
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
            )}

            {/* QR code */}
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3">
              <div className="text-sm font-body font-bold text-foreground">
                Votre badge d&apos;entrée
              </div>
              <QRCode value={invitationUrl} size={180} />
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Présentez ce QR code à l&apos;entrée le jour de la cérémonie.
              </p>
            </div>

            {/* CTA */}
            <div>
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
                  onClick={handleShare}
                  className="flex-1 text-center bg-muted text-muted-foreground font-body font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                >
                  <Icon name="share-2" size={12} />
                  Partager
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiInvitationBody({
  invitation,
  fallbackTitle,
}: {
  invitation: InvitationJson;
  fallbackTitle: string;
}) {
  const titleBlock = invitation.blocks.find((b) => b.type === 'title');
  const subtitleBlock = invitation.blocks.find((b) => b.type === 'subtitle');
  const bodyBlocks = invitation.blocks.filter((b) => b.type === 'paragraph' || b.type === 'quote');
  const ctaBlock = invitation.blocks.find((b) => b.type === 'cta');

  return (
    <>
      <h2 className="font-headings font-bold text-2xl lg:text-4xl text-foreground mb-2 leading-tight">
        {titleBlock?.text ?? fallbackTitle}
      </h2>
      {subtitleBlock && (
        <div className="text-xs lg:text-sm uppercase tracking-[0.2em] text-gold font-bold mb-4">
          {subtitleBlock.text}
        </div>
      )}
      <div className="flex items-center justify-center gap-3 mb-6" aria-hidden>
        <span className="h-px w-10 bg-gold/60" />
        <span className="text-gold text-xs">◆</span>
        <span className="h-px w-10 bg-gold/60" />
      </div>
      <div className="max-w-prose mx-auto text-left lg:text-center flex flex-col gap-4 mb-6">
        {bodyBlocks.map((b) =>
          b.type === 'quote' ? (
            <blockquote
              key={b.id}
              className="border-l-2 border-gold/60 pl-3 italic text-sm lg:text-base text-foreground/75 text-left"
            >
              {b.text}
            </blockquote>
          ) : (
            <p key={b.id} className="text-sm lg:text-base text-foreground/85 leading-relaxed">
              {b.text}
            </p>
          ),
        )}
      </div>
      {ctaBlock && <p className="text-sm text-gold font-bold italic mb-6">{ctaBlock.text}</p>}
    </>
  );
}
