'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Image } from '@/components/Image';
import { Icon } from '@/components/Icon';

export default function ProjectionPage() {
  const [enabled, setEnabled] = useState(true);
  const [moderate, setModerate] = useState(true);
  const [showCaption, setShowCaption] = useState(true);
  const [autoTimer, setAutoTimer] = useState(6);

  return (
    <AppLayout pageTitle="Projection live" tier="premium">
      <PreviewBanner />

      <PageHeader
        title="Projection live"
        subtitle="Projetez les photos envoyées par vos invités sur grand écran, en temps réel."
      >
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="link-2" size={14} />
            <span className="hidden sm:inline">Lien projection</span>
            <span className="sm:hidden">Lien</span>
          </button>
          <button
            type="button"
            className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="projector" size={14} />
            Ouvrir
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-6">
        {/* Preview */}
        <div className="bg-dark border border-border rounded-xl overflow-hidden relative">
          <Image
            ar="16:9"
            src="/banani/cta.jpg"
            prompt="Grande salle de réception avec écran de projection photo"
            className="w-full"
          />
          <div className="absolute inset-0 bg-dark opacity-30" aria-hidden />
          {showCaption && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 bg-dark/70 backdrop-blur-sm rounded-lg px-4 py-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-headings font-bold text-sm">A</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-body font-bold text-primary-foreground truncate">
                  Awa Camara
                </div>
                <div className="text-xs text-primary-foreground/70 truncate">
                  « Tous mes vœux de bonheur — du soleil pour vos vies ! »
                </div>
              </div>
              <div className="text-xs text-primary-foreground/60 shrink-0">à l&apos;instant</div>
            </div>
          )}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-success text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full">
            <span
              className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"
              aria-hidden
            />
            EN DIRECT
          </div>
        </div>

        {/* Config */}
        <aside className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="enable" className="font-body font-bold text-sm text-foreground">
                Activer la projection
              </label>
              <button
                id="enable"
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-primary-foreground rounded-full transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Les invités envoient leurs photos via un lien ou QR code.
            </p>
          </div>

          <hr className="border-border" />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="mod" className="font-body font-bold text-sm text-foreground">
                Modération avant diffusion
              </label>
              <button
                id="mod"
                type="button"
                role="switch"
                aria-checked={moderate}
                onClick={() => setModerate((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${moderate ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-primary-foreground rounded-full transition-transform ${
                    moderate ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Vous approuvez chaque photo avant qu&apos;elle apparaisse.
            </p>
          </div>

          <hr className="border-border" />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="cap" className="font-body font-bold text-sm text-foreground">
                Afficher nom + message
              </label>
              <button
                id="cap"
                type="button"
                role="switch"
                aria-checked={showCaption}
                onClick={() => setShowCaption((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${showCaption ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-primary-foreground rounded-full transition-transform ${
                    showCaption ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <label
              htmlFor="timer"
              className="font-body font-bold text-sm text-foreground block mb-2"
            >
              Durée par photo : {autoTimer}s
            </label>
            <input
              id="timer"
              type="range"
              min={3}
              max={15}
              value={autoTimer}
              onChange={(e) => setAutoTimer(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>3s</span>
              <span>15s</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Queue de modération */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headings font-bold text-base text-foreground">
            File d&apos;attente modération
          </h3>
          <span className="text-xs bg-warning-light text-warning font-body font-bold px-2 py-1 rounded-md">
            3 en attente
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="relative group">
              <Image
                ar="1:1"
                keywords="african,wedding,party,photo"
                prompt={`Photo invité ${i + 1}`}
                className="w-full rounded-lg"
              />
              <div className="absolute inset-0 bg-dark opacity-0 group-hover:opacity-60 transition-opacity rounded-lg" />
              <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  className="flex-1 bg-success text-primary-foreground text-xs font-bold py-1.5 rounded-md"
                >
                  Approuver
                </button>
                <button
                  type="button"
                  className="bg-danger text-primary-foreground p-1.5 rounded-md"
                  aria-label="Refuser"
                >
                  <Icon name="user-x" size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
