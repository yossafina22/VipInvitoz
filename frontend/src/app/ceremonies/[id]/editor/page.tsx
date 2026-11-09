'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { AlertBanner } from '@/components/AlertBanner';
import { AIChat } from '@/components/AIChat';
import { InvitationPreview } from '@/components/InvitationPreview';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

const MUSIC_TRACKS = [
  { name: 'Jazz africain doux', artist: 'Ensemble Instrumental' },
  { name: 'Kora traditionnelle', artist: 'Musique du Sénégal' },
  { name: 'Rythme moderne joyeux', artist: 'Percussion contemporaine' },
  { name: 'Silence', artist: 'Aucune musique' },
];

export default function InvitationEditorPage() {
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [lang, setLang] = useState<'FR' | 'EN' | 'DE'>('FR');
  const [showRsvp, setShowRsvp] = useState(true);
  const [showQr, setShowQr] = useState(true);

  return (
    <AppLayout pageTitle="Éditer l'invitation" tier="premium">
      <PreviewBanner />

      <AlertBanner
        type="success"
        message="✓ Invitation générée en 47 secondes ! Vous avez 8 crédits IA restants pour des modifications."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 mt-6">
        {/* Left — Chat & options */}
        <div className="flex flex-col gap-5">
          <AIChat creditsLeft={8} isPremium />

          <div className="bg-card border border-border rounded-xl p-5">
            <PageHeader title="Musique de fond" subtitle="Choisir une ambiance" />
            <div className="flex flex-col gap-2 mt-3">
              {MUSIC_TRACKS.map((song, i) => {
                const active = i === selectedTrack;
                return (
                  <button
                    key={song.name}
                    type="button"
                    onClick={() => setSelectedTrack(i)}
                    className={`p-3 rounded-lg border flex items-start gap-3 text-left transition-colors ${
                      active
                        ? 'border-primary bg-secondary'
                        : 'border-border bg-background hover:border-primary/60'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon name={active ? 'check' : 'play'} size={12} />
                    </div>
                    <div className="flex-1 text-xs min-w-0">
                      <div className="font-body font-bold text-foreground truncate">
                        {song.name}
                      </div>
                      <div className="text-muted-foreground truncate">{song.artist}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <PageHeader title="Options avancées" subtitle="Personnalisation" />
            <div className="flex flex-col gap-3 mt-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-body text-foreground">Langue invitation</label>
                <div className="flex gap-1">
                  {(['FR', 'EN', 'DE'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`text-xs px-2.5 py-1 rounded-md border ${
                        l === lang
                          ? 'border-primary bg-secondary text-primary font-bold'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center justify-between pt-3 border-t border-border cursor-pointer">
                <span className="text-sm font-body text-foreground">Afficher le RSVP</span>
                <input
                  type="checkbox"
                  checked={showRsvp}
                  onChange={(e) => setShowRsvp(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between pt-3 border-t border-border cursor-pointer">
                <span className="text-sm font-body text-foreground">Afficher le QR code</span>
                <input
                  type="checkbox"
                  checked={showQr}
                  onChange={(e) => setShowQr(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Center — Live preview */}
        <div className="flex flex-col gap-4">
          <PageHeader title="Aperçu en direct" subtitle="Rendu mobile" />
          <div className="mx-auto w-full max-w-sm">
            <InvitationPreview
              emoji="💍"
              title="Mariage de Fatoumata & Ibrahima"
              body="C'est avec une immense joie que nous vous convions à célébrer notre union dans une atmosphère chaleureuse, festive et familiale."
              date="14 juin 2025"
              time="15h00"
              location="Dakar"
              family="La famille Diallo & Konaté"
            />
          </div>
        </div>

        {/* Right — Details + ready */}
        <div className="flex flex-col gap-5">
          <PageHeader title="Détails de la cérémonie" />
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <div>
              <div className="text-xs font-body text-muted-foreground">Type</div>
              <div className="font-body font-bold text-sm text-foreground mt-1">Mariage</div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="text-xs font-body text-muted-foreground">Date &amp; Heure</div>
              <div className="font-body font-bold text-sm text-foreground mt-1">
                14 juin 2025 à 15h00
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="text-xs font-body text-muted-foreground">Lieu</div>
              <div className="font-body font-bold text-sm text-foreground mt-1">
                Hôtel Terrou-Bi, Dakar
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="text-xs font-body text-muted-foreground">Hôte</div>
              <div className="font-body font-bold text-sm text-foreground mt-1">
                La famille Diallo &amp; Konaté
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <PageHeader title="Texte d'invitation" />
            <div className="bg-input border border-border rounded-lg p-3 text-xs text-foreground leading-relaxed mt-3">
              C&apos;est avec une immense joie que nous vous convions à célébrer notre union dans
              une atmosphère chaleureuse, festive et familiale. Que ce moment soit mémorable pour
              tous.
            </div>
          </div>

          <div className="bg-secondary border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="font-body font-bold text-sm text-secondary-foreground">
              ✓ Prêt à envoyer
            </div>
            <p className="text-xs text-secondary-foreground opacity-80">
              L&apos;invitation est optimisée pour mobile et peut être envoyée immédiatement via
              WhatsApp.
            </p>
            <button
              type="button"
              className="bg-primary text-primary-foreground text-center font-body font-bold py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              Continuer → Ajouter invités
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
