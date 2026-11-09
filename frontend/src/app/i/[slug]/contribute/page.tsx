'use client';

import { useState } from 'react';
import { Image } from '@/components/Image';
import { Icon } from '@/components/Icon';
import { UserAvatar } from '@/components/UserAvatar';

export const runtime = 'nodejs';

interface Photo {
  id: string;
  author: string;
  index: number;
  caption?: string;
  at: string;
}

const RECENT: Photo[] = [
  { id: '1', author: 'Awa C.', index: 1, caption: 'La mariée est magnifique !', at: "à l'instant" },
  { id: '2', author: 'Kofi M.', index: 4, caption: "Les enfants s'amusent", at: 'il y a 2 min' },
  { id: '3', author: 'Aïssatou D.', index: 0, at: 'il y a 5 min' },
  { id: '4', author: 'Raoul M.', index: 15, caption: 'Arrivée des invités', at: 'il y a 8 min' },
];

export default function ContributePage() {
  const [sent, setSent] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center">
          <Icon name="camera" size={16} className="text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-headings font-bold text-sm text-foreground truncate">
            Mariage Aïssatou & Moussa
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" aria-hidden />
            <span className="text-xs text-muted-foreground">Projection en direct</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
        {/* Upload area */}
        {!sent && (
          <div className="mb-6">
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden border border-border mb-3">
                <img src={preview} alt="Preview" className="w-full h-auto" />
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-card/90 rounded-full flex items-center justify-center shadow-md"
                  aria-label="Retirer"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            ) : (
              <label className="block aspect-[4/3] border-2 border-dashed border-border rounded-2xl bg-card flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-colors mb-3">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPreview(URL.createObjectURL(file));
                  }}
                />
                <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center">
                  <Icon name="camera" size={24} className="text-primary" />
                </div>
                <div className="text-center px-6">
                  <div className="font-headings font-bold text-base text-foreground mb-0.5">
                    Prenez ou choisissez une photo
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Elle s&apos;affichera sur le grand écran
                  </div>
                </div>
              </label>
            )}

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Un petit message pour les mariés… (optionnel)"
              maxLength={120}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none mb-3"
            />

            <button
              type="button"
              disabled={!preview}
              onClick={() => setSent(true)}
              className="w-full bg-primary text-primary-foreground font-body font-bold py-3.5 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              <Icon name="send" size={16} />
              Envoyer à la projection
            </button>
          </div>
        )}

        {sent && (
          <div className="bg-success-light border border-success/30 rounded-xl p-5 text-center mb-6">
            <div className="w-14 h-14 bg-success rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="check" size={28} className="text-primary-foreground" />
            </div>
            <h2 className="font-headings font-bold text-lg text-foreground mb-1">
              Photo envoyée !
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Elle apparaîtra sur le grand écran après modération.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setPreview(null);
                setCaption('');
              }}
              className="bg-primary text-primary-foreground font-body font-bold px-6 py-2.5 rounded-lg text-sm"
            >
              Envoyer une autre
            </button>
          </div>
        )}

        {/* Live feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headings font-bold text-base text-foreground">Mur en direct</h2>
            <span className="text-xs text-muted-foreground">{RECENT.length} photos</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {RECENT.map((p) => (
              <div key={p.id} className="bg-card rounded-xl overflow-hidden border border-border">
                <Image
                  ar="1:1"
                  keywords="wedding,party,african"
                  prompt={p.author}
                  className="w-full"
                />
                <div className="p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <UserAvatar name={p.author} index={p.index} className="w-5 h-5 shrink-0" />
                    <span className="text-[11px] font-body font-bold text-foreground truncate">
                      {p.author}
                    </span>
                  </div>
                  {p.caption && (
                    <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                      « {p.caption} »
                    </p>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-1">{p.at}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border px-4 py-3 text-center">
        <p className="text-[11px] text-muted-foreground">
          Propulsé par <span className="font-body font-bold text-primary">VipInvitoz</span>
        </p>
      </footer>
    </div>
  );
}
