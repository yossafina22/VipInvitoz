'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { RSVPStatusBar } from '@/components/RSVPStatusBar';
import { GuestRow, GUEST_GRID_COLS } from '@/components/GuestRow';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

interface GuestsResponse {
  ceremonyId: string | null;
  guests: Guest[];
}

type Status = 'loading' | 'preview' | 'live';

export default function GuestsPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [ceremonyId, setCeremonyId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await api<GuestsResponse>('/api/guests');
      setCeremonyId(res.ceremonyId);
      setGuests(res.guests);
      setStatus('live');
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.phone ?? '').toLowerCase().includes(q) ||
        (g.email ?? '').toLowerCase().includes(q),
    );
  }, [guests, search]);

  const stats = useMemo(() => {
    // Invitation.rsvpStatus is not wired yet — every guest counts as pending
    // until invitations are sent and RSVPs come in.
    const total = guests.length;
    const pending = total;
    return { total, confirmed: 0, declined: 0, pending };
  }, [guests]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!ceremonyId || !newName.trim()) return;
    setAdding(true);
    setFormError(null);
    try {
      await api('/api/guests', {
        method: 'POST',
        body: {
          ceremonyId,
          name: newName.trim(),
          ...(newPhone.trim() ? { phone: newPhone.trim() } : {}),
          ...(newEmail.trim() ? { email: newEmail.trim() } : {}),
        },
      });
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setFormOpen(false);
      await refetch();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'GUEST_PHONE_DUPLICATE') {
          setFormError('Un invité avec ce numéro est déjà dans la liste.');
        } else if (err.code === 'VALIDATION_FAILED') {
          setFormError('Nom ou email invalide.');
        } else {
          setFormError('Erreur: impossible d’ajouter cet invité.');
        }
      } else {
        setFormError('Erreur réseau.');
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet invité ?')) return;
    setDeletingId(id);
    try {
      await api(`/api/guests/${id}`, { method: 'DELETE' });
      await refetch();
    } catch {
      alert('Impossible de supprimer. Réessayez.');
    } finally {
      setDeletingId(null);
    }
  }

  const isPreview = status === 'preview' || (status === 'live' && !ceremonyId);

  return (
    <AppLayout pageTitle="Invités & RSVP" tier="premium">
      {isPreview && <PreviewBanner />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Total invités</div>
          <div className="font-headings font-bold text-3xl text-foreground mb-3">
            {status === 'loading' ? '…' : stats.total}
          </div>
          <RSVPStatusBar
            confirmed={stats.confirmed}
            declined={stats.declined}
            pending={stats.pending}
            total={Math.max(stats.total, 1)}
          />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Confirmés</div>
          <div className="font-headings font-bold text-3xl text-success mb-3">
            {stats.confirmed}
          </div>
          <div className="text-xs text-muted-foreground">
            RSVP branchés dès que les invitations seront envoyées.
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">En attente</div>
          <div className="font-headings font-bold text-3xl text-warning mb-3">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">
            {stats.total === 0
              ? 'Ajoutez votre premier invité ci-dessous.'
              : 'Aucune réponse enregistrée pour l’instant.'}
          </div>
        </div>
      </div>

      <PageHeader
        title="Liste des invités"
        subtitle={
          status === 'loading'
            ? 'Chargement…'
            : `${stats.total} invité${stats.total > 1 ? 's' : ''}`
        }
      >
        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="bg-input border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground w-full sm:w-48 outline-none focus:border-primary"
            />
            <Icon
              name="search"
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            disabled={!ceremonyId}
            className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="plus" size={14} />
            {formOpen ? 'Fermer' : 'Ajouter'}
          </button>
        </div>
      </PageHeader>

      {formOpen && ceremonyId && (
        <form
          onSubmit={handleAdd}
          className="bg-card border border-border rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom *"
            required
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="+221 77 123 45 67"
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email (optionnel)"
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-body font-bold disabled:opacity-50"
            >
              {adding ? 'Ajout…' : 'Ajouter l’invité'}
            </button>
            {formError && <p className="text-xs text-danger">{formError}</p>}
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div
          className={`hidden md:grid ${GUEST_GRID_COLS} items-center gap-4 px-5 py-3 bg-muted border-b border-border text-xs font-body font-bold text-muted-foreground uppercase tracking-wide`}
        >
          <div>Invité</div>
          <div>Contact</div>
          <div>Statut</div>
          <div className="text-center">Acc.</div>
          <div>Table</div>
          <div className="text-right">Actions</div>
        </div>

        {status === 'loading' ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : !ceremonyId ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl mb-2 opacity-40">🔒</div>
            <p className="text-sm text-muted-foreground">
              Connectez-vous et créez une cérémonie pour gérer vos invités.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="text-4xl mb-2 opacity-40">👥</div>
            <p className="text-sm text-muted-foreground">
              {search
                ? 'Aucun invité ne correspond à la recherche.'
                : 'Aucun invité pour l’instant. Cliquez sur « Ajouter » pour commencer.'}
            </p>
          </div>
        ) : (
          filtered.map((g, i) => (
            <GuestRow
              key={g.id}
              id={g.id}
              name={g.name}
              phone={g.phone ?? '—'}
              {...(g.email ? { email: g.email } : {})}
              status="pending"
              companions={0}
              table="—"
              index={i}
              onDelete={() => handleDelete(g.id)}
              deleting={deletingId === g.id}
            />
          ))
        )}
      </div>

      {/* Partage direct — mock pending invitation routes */}
      <div className="bg-card border border-dashed border-border rounded-xl p-5 md:p-6 text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Bientôt</div>
        <h3 className="font-headings font-bold text-lg text-foreground mb-1">
          Envoi des invitations
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          L’envoi WhatsApp / email + le partage de lien seront câblés dès que la génération des
          invitations sera branchée.
        </p>
      </div>
    </AppLayout>
  );
}
