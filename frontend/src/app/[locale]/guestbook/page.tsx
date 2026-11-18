'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { UserAvatar } from '@/components/UserAvatar';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';

interface Entry {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  pinnedAt: string | null;
}

interface GuestbookResponse {
  ceremonyId: string | null;
  entries: Entry[];
}

// Fallback displayed when the viewer isn't authenticated, has no ceremony yet,
// or when the API errors. Lets the /guestbook route stay demo-able in preview
// mode without a seeded DB.
const MOCK_ENTRIES: Entry[] = [
  {
    id: 'mock-1',
    authorName: 'Aïssatou D.',
    content:
      '« Que votre union soit bénie de mille étoiles. Du bonheur et des enfants qui vous ressemblent, incha Allah. »',
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    pinnedAt: null,
  },
  {
    id: 'mock-2',
    authorName: 'Raoul M.',
    content:
      '« Depuis Francfort, toute la famille vous envoie son amour. Une belle journée à vous deux, on pense fort à vous. »',
    createdAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
    pinnedAt: null,
  },
  {
    id: 'mock-3',
    authorName: 'Fatou K.',
    content:
      "« La famille Kouassi d'Abidjan vous embrasse. Mariage réussi — que la suite soit à l'image de ce jour. »",
    createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    pinnedAt: null,
  },
  {
    id: 'mock-4',
    authorName: 'Kofi Mensah',
    content:
      '« Longue vie et beaucoup de joie. Que Dieu vous garde unis comme les palmiers côte à côte. »',
    createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    pinnedAt: null,
  },
  {
    id: 'mock-5',
    authorName: 'Fatoumata Ba',
    content:
      '« Souvenirs de Dakar. Merci pour cette belle journée, vous êtes rayonnants tous les deux. »',
    createdAt: new Date(Date.now() - 28 * 3600_000).toISOString(),
    pinnedAt: null,
  },
];

const RELATIVE_FMT = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

function relativeTime(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 60) return RELATIVE_FMT.format(diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return RELATIVE_FMT.format(diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  return RELATIVE_FMT.format(diffDay, 'day');
}

function EntryCard({ e, index }: { e: Entry; index: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar name={e.authorName} index={index} className="w-10 h-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-body font-bold text-sm text-foreground truncate">{e.authorName}</div>
          <div className="text-xs text-muted-foreground">{relativeTime(e.createdAt)}</div>
        </div>
        {e.pinnedAt && (
          <span className="text-[11px] font-body font-bold px-2 py-1 rounded-md bg-gold-light text-gold flex items-center gap-1 shrink-0">
            <Icon name="bookmark" size={11} />
            Épinglé
          </span>
        )}
      </div>

      <p className="text-sm text-foreground italic leading-relaxed">{e.content}</p>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          aria-label="J'aime"
        >
          <Icon name="heart" size={12} />
          <span>24</span>
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 ml-auto"
          aria-label={e.pinnedAt ? 'Désépingler' : 'Épingler'}
        >
          <Icon name="bookmark" size={12} />
          {e.pinnedAt ? 'Désépingler' : 'Épingler'}
        </button>
      </div>
    </div>
  );
}

type Status = 'loading' | 'live' | 'preview';

export default function GuestbookPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<GuestbookResponse>('/api/guestbook');
        if (cancelled) return;
        if (res.ceremonyId) {
          // Real ceremony exists — show live data (may be empty).
          setEntries(res.entries);
          setStatus('live');
        } else {
          // Authed but no ceremony yet — show sample messages so the page
          // still demos what it will look like.
          setEntries(MOCK_ENTRIES);
          setStatus('preview');
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          // Not authenticated — fall back to preview.
        }
        setEntries(MOCK_ENTRIES);
        setStatus('preview');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout pageTitle="Livre d'or" tier="premium">
      {status === 'preview' && <PreviewBanner />}

      <PageHeader
        title="Livre d'or"
        subtitle={
          status === 'loading'
            ? 'Chargement…'
            : `${entries.length} message${entries.length > 1 ? 's' : ''} de vos invités`
        }
      >
        <button
          type="button"
          className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Icon name="download" size={14} />
          <span className="hidden sm:inline">Exporter souvenir</span>
          <span className="sm:hidden">Export</span>
        </button>
      </PageHeader>

      {/* Entries */}
      {status === 'loading' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-10 w-full bg-muted rounded mb-3" />
              <div className="h-4 w-11/12 bg-muted rounded mb-2" />
              <div className="h-4 w-8/12 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center mb-6">
          <div className="text-4xl mb-3 opacity-40">💌</div>
          <h3 className="font-headings font-bold text-base text-foreground mb-1">
            Pas encore de message
          </h3>
          <p className="text-sm text-muted-foreground">
            Partagez le lien du livre d&apos;or avec vos invités pour recevoir leurs mots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {entries.map((e, i) => (
            <EntryCard key={e.id} e={e} index={i} />
          ))}
        </div>
      )}

      {/* CTA invités */}
      <div className="bg-secondary border border-border rounded-xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-headings font-bold text-lg text-foreground mb-1">
            Invitez à laisser un mot
          </h3>
          <p className="text-sm text-muted-foreground">
            Partagez le lien du livre d&apos;or avec vos invités.
          </p>
        </div>
        <button
          type="button"
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-body font-bold text-sm shrink-0 flex items-center gap-2"
        >
          <Icon name="link-2" size={14} />
          Copier le lien
        </button>
      </div>
    </AppLayout>
  );
}
