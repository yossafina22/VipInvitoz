'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { UserAvatar } from '@/components/UserAvatar';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';

interface SeatGuest {
  id: string;
  name: string;
}
interface SeatingTable {
  id: string;
  label: string;
  capacity: number;
  order: number;
  guests: SeatGuest[];
}
interface SeatingResponse {
  ceremonyId: string | null;
  tables: SeatingTable[];
  unassigned: SeatGuest[];
}

type Status = 'loading' | 'preview' | 'live';

function nextTableLabel(tables: SeatingTable[]): string {
  const taken = new Set<number>();
  for (const t of tables) {
    const m = /\bTable\s*(\d+)/i.exec(t.label);
    if (m && m[1]) taken.add(Number(m[1]));
  }
  let n = 1;
  while (taken.has(n)) n += 1;
  return `Table ${n}`;
}

export default function SeatingPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [ceremonyId, setCeremonyId] = useState<string | null>(null);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [unassigned, setUnassigned] = useState<SeatGuest[]>([]);
  const [movingGuest, setMovingGuest] = useState<SeatGuest | null>(null);
  const [busy, setBusy] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const res = await api<SeatingResponse>('/api/seating');
      setCeremonyId(res.ceremonyId);
      setTables(res.tables);
      setUnassigned(res.unassigned);
      setStatus(res.ceremonyId ? 'live' : 'preview');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStatus('preview');
      } else {
        setStatus('preview');
      }
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const stats = useMemo(() => {
    const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);
    const totalAssigned = tables.reduce((s, t) => s + t.guests.length, 0);
    return { totalCapacity, totalAssigned };
  }, [tables]);

  async function handleAddTable() {
    if (!ceremonyId || busy) return;
    setBusy(true);
    try {
      await api('/api/seating/tables', {
        method: 'POST',
        body: {
          ceremonyId,
          label: nextTableLabel(tables),
          capacity: 8,
        },
      });
      await refetch();
    } catch {
      alert('Impossible de créer la table.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm('Supprimer cette table ? Les invités seront déplacés en « à placer ».')) {
      return;
    }
    setBusy(true);
    try {
      await api(`/api/seating/tables/${tableId}`, { method: 'DELETE' });
      await refetch();
    } catch {
      alert('Impossible de supprimer la table.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(guestId: string, tableId: string | null) {
    setBusy(true);
    try {
      await api(`/api/guests/${guestId}/seating`, {
        method: 'PATCH',
        body: { tableId },
      });
      await refetch();
      setMovingGuest(null);
    } catch {
      alert('Impossible de déplacer cet invité.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout pageTitle="Plan de table" tier="premium">
      {status === 'preview' && <PreviewBanner />}

      <PageHeader
        title="Plan de table"
        subtitle={
          status === 'loading'
            ? 'Chargement…'
            : `${stats.totalAssigned}/${stats.totalCapacity} invités placés — ${unassigned.length} à répartir`
        }
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAddTable}
            disabled={!ceremonyId || busy}
            className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="plus" size={14} />
            Table
          </button>
        </div>
      </PageHeader>

      {!ceremonyId && status !== 'loading' ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center mb-6">
          <div className="text-4xl mb-2 opacity-40">🪑</div>
          <p className="text-sm text-muted-foreground">
            Connectez-vous et créez une cérémonie pour organiser votre plan de table.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map((t) => {
              const empty = Math.max(0, t.capacity - t.guests.length);
              const full = empty === 0;
              const over = t.guests.length > t.capacity;
              return (
                <div
                  key={t.id}
                  className="bg-card border border-border rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="font-headings font-bold text-sm text-foreground truncate">
                      {t.label}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                          over
                            ? 'bg-danger-light text-danger'
                            : full
                              ? 'bg-success-light text-success'
                              : 'bg-warning-light text-warning'
                        }`}
                      >
                        {t.guests.length}/{t.capacity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTable(t.id)}
                        disabled={busy}
                        className="text-muted-foreground hover:text-danger disabled:opacity-40"
                        aria-label="Supprimer la table"
                      >
                        <Icon name="trash-2" size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.guests.map((g, i) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setMovingGuest(g)}
                        className="flex items-center gap-1.5 bg-background border border-border rounded-full pl-0.5 pr-2 py-0.5 hover:border-primary"
                      >
                        <UserAvatar name={g.name} index={i} className="w-5 h-5" />
                        <span className="text-[11px] font-body text-foreground truncate max-w-[6.5rem]">
                          {g.name}
                        </span>
                      </button>
                    ))}
                    {Array.from({ length: empty }).map((_, i) => (
                      <div
                        key={`e-${i}`}
                        className="flex items-center justify-center w-5 h-5 border border-dashed border-border rounded-full text-muted-foreground"
                        aria-label="Siège vide"
                      >
                        <Icon name="plus" size={10} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={handleAddTable}
              disabled={!ceremonyId || busy}
              className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[160px] disabled:opacity-50"
            >
              <Icon name="plus" size={28} />
              <span className="text-sm font-body font-bold">Ajouter une table</span>
            </button>
          </div>

          <aside className="bg-card border border-border rounded-xl p-4 lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="users" size={14} className="text-primary" />
              <h3 className="font-headings font-bold text-sm text-foreground">
                À placer ({unassigned.length})
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Cliquez sur un invité pour l’affecter à une table.
            </p>
            <div className="flex flex-col gap-2">
              {unassigned.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Tous vos invités sont placés 🎉
                </p>
              ) : (
                unassigned.map((g, i) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setMovingGuest(g)}
                    disabled={busy}
                    className="flex items-center gap-2 bg-background border border-border rounded-lg px-2 py-1.5 hover:border-primary transition-colors text-left disabled:opacity-50"
                  >
                    <UserAvatar name={g.name} index={i} className="w-7 h-7 shrink-0" />
                    <span className="text-xs font-body font-bold text-foreground truncate flex-1">
                      {g.name}
                    </span>
                    <Icon name="move" size={12} className="text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Move / assign dialog */}
      {movingGuest && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => !busy && setMovingGuest(null)}
        >
          <div
            className="bg-card border border-border rounded-xl p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headings font-bold text-base text-foreground mb-3">
              Déplacer {movingGuest.name}
            </h3>
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => handleAssign(movingGuest.id, null)}
                disabled={busy}
                className="text-left px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary text-sm text-muted-foreground disabled:opacity-50"
              >
                Retirer de la table (laisser "à placer")
              </button>
              {tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleAssign(movingGuest.id, t.id)}
                  disabled={busy}
                  className="text-left px-3 py-2 rounded-lg border border-border hover:border-primary text-sm flex items-center justify-between gap-2 disabled:opacity-50"
                >
                  <span className="truncate">{t.label}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {t.guests.length}/{t.capacity}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMovingGuest(null)}
              disabled={busy}
              className="mt-4 w-full py-2 text-sm text-muted-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* AI placement — mock */}
      <div className="bg-secondary border border-dashed border-border rounded-xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon name="sparkles" size={20} className="text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-headings font-bold text-base text-foreground mb-1">
              Auto-placement intelligent
            </h3>
            <p className="text-sm text-muted-foreground">
              L’IA regroupera les familles et équilibrera vos tables — fonctionnalité à venir.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled
          className="bg-muted text-muted-foreground px-5 py-2.5 rounded-lg font-body font-bold text-sm shrink-0 cursor-not-allowed"
        >
          Bientôt
        </button>
      </div>
    </AppLayout>
  );
}
