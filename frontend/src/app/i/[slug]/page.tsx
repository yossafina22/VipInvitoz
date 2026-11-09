'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Image } from '@/components/Image';

export const runtime = 'nodejs';

type RSVPStatus = 'idle' | 'confirmed' | 'declined';

export default function GuestInvitationPage() {
  const [rsvp, setRsvp] = useState<RSVPStatus>('idle');
  const [guests, setGuests] = useState(1);

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
        {/* Invitation card */}
        <div className="px-4 py-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="relative h-60 sm:h-72 lg:h-96 bg-input overflow-hidden">
              <Image
                ar="4:3"
                src="/banani/invitation-cover.jpg"
                prompt="Couple africain en mariage, mariée en robe blanche avec bijoux dorés, marié en boubou crème"
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
              <div className="text-5xl mb-3">💍</div>
              <div className="text-xs font-body uppercase tracking-widest text-muted-foreground mb-3">
                Invitation
              </div>
              <h2 className="font-headings font-bold text-2xl lg:text-3xl text-foreground mb-3 leading-tight">
                Mariage de Fatoumata &amp; Ibrahima
              </h2>
              <p className="text-sm text-foreground opacity-80 mb-6 leading-relaxed">
                C&apos;est avec une immense joie que nous vous convions à célébrer notre union dans
                une atmosphère chaleureuse, festive et familiale.
              </p>

              <div className="flex justify-center items-stretch gap-3 lg:gap-4 mb-6 text-center">
                {[
                  { label: 'Date', value: '14 juin 2025' },
                  { label: 'Heure', value: '15h00' },
                  { label: 'Lieu', value: 'Dakar' },
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

              <div className="text-xs text-muted-foreground mb-6">
                La famille Diallo &amp; Konaté
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setRsvp('confirmed')}
                  className={`text-sm font-body font-bold px-6 py-3 rounded-lg w-full transition-colors ${
                    rsvp === 'confirmed'
                      ? 'bg-success text-primary-foreground'
                      : 'bg-success text-primary-foreground hover:bg-success/90'
                  }`}
                >
                  {rsvp === 'confirmed' ? '✓ Présence confirmée' : '✓ Je confirme ma présence'}
                </button>
                <button
                  type="button"
                  onClick={() => setRsvp('declined')}
                  className={`text-sm font-body font-bold px-4 py-3 rounded-lg transition-colors ${
                    rsvp === 'declined'
                      ? 'bg-danger text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {rsvp === 'declined' ? 'Absence enregistrée' : 'Je ne peux pas venir'}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Icon name="music" size={12} />
                <span>Musique : Jazz africain doux</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 pb-6">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            {[
              {
                icon: 'map-pin',
                title: 'Lieu complet',
                body: 'Hôtel Terrou-Bi, Point E, Dakar, Sénégal',
                muted: true,
              },
              {
                icon: 'phone',
                title: 'Contact',
                body: '+221 33 882 20 20',
                link: 'tel:+221338822020',
              },
              {
                icon: 'info',
                title: 'Indications',
                body: 'Parking à droite. Valet gratuit. Toilettes au rez-de-chaussée.',
                muted: true,
              },
            ].map((row) => (
              <div key={row.title} className="flex items-start gap-3">
                <Icon name={row.icon} size={14} className="text-primary mt-1 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-foreground mb-0.5">{row.title}</div>
                  {row.link ? (
                    <a href={row.link} className="text-primary">
                      {row.body}
                    </a>
                  ) : (
                    <div className={row.muted ? 'text-muted-foreground' : 'text-foreground'}>
                      {row.body}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

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
                Indiquez combien de personnes vous accompagneront.
              </div>
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="px-4 pb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground mb-3">Votre QR code personnel</div>
            <div className="bg-white border border-border rounded-lg p-3 inline-block mb-2">
              <svg
                width="120"
                height="120"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="QR code de l'invité"
              >
                <defs>
                  <pattern
                    id="qr-wax"
                    x="0"
                    y="0"
                    width="10"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="5" cy="5" r="2" fill="#C4602A" />
                    <circle cx="0" cy="0" r="1" fill="#C9922A" />
                    <circle cx="10" cy="0" r="1" fill="#C9922A" />
                    <circle cx="0" cy="10" r="1" fill="#C9922A" />
                    <circle cx="10" cy="10" r="1" fill="#C9922A" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#qr-wax)" />
                <rect x="20" y="20" width="60" height="60" fill="#C4602A" rx="2" />
              </svg>
            </div>
            <div className="text-xs text-muted-foreground">
              Scannez ce code à l&apos;entrée pour valider votre présence.
            </div>
          </div>
        </div>

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
