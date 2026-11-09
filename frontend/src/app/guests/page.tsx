'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { RSVPStatusBar } from '@/components/RSVPStatusBar';
import { GuestRow, GUEST_GRID_COLS } from '@/components/GuestRow';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';

interface InvitationState {
  slug: string;
  rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  companionCount: number;
  rsvpAt: string | null;
  viewedAt: string | null;
}

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  invitation: InvitationState | null;
}

function toRowStatus(s: string | undefined): 'confirmed' | 'declined' | 'pending' {
  if (s === 'CONFIRMED') return 'confirmed';
  if (s === 'DECLINED') return 'declined';
  return 'pending';
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
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shareGuest, setShareGuest] = useState<Guest | null>(null);
  const [sharingChannel, setSharingChannel] = useState<'EMAIL' | 'WHATSAPP' | 'LINK' | null>(null);

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
    const total = guests.length;
    let confirmed = 0;
    let declined = 0;
    let companionSum = 0;
    for (const g of guests) {
      const s = g.invitation?.rsvpStatus;
      if (s === 'CONFIRMED') confirmed += 1;
      else if (s === 'DECLINED') declined += 1;
      companionSum += g.invitation?.companionCount ?? 0;
    }
    const pending = total - confirmed - declined;
    return { total, confirmed, declined, pending, companionSum };
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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function handleInviteOpen(id: string) {
    const g = guests.find((x) => x.id === id);
    if (!g) return;
    // Pre-generate the invitation so copy/WhatsApp/email all share the same slug.
    setInvitingId(id);
    try {
      await api(`/api/guests/${id}/invite`, { method: 'POST' });
      setShareGuest(g);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'GUEST_NOT_FOUND'
          ? 'Invité introuvable.'
          : 'Impossible de préparer l’invitation.';
      showToast(msg);
    } finally {
      setInvitingId(null);
    }
  }

  async function handleShare(channel: 'EMAIL' | 'WHATSAPP' | 'LINK') {
    if (!shareGuest) return;
    setSharingChannel(channel);
    try {
      const res = await api<{
        publicUrl: string;
        waUrl?: string;
        emailQueueMissing?: true;
      }>(`/api/guests/${shareGuest.id}/invite/send`, {
        method: 'POST',
        body: { channel, origin: window.location.origin },
      });
      const absoluteUrl = res.publicUrl.startsWith('http')
        ? res.publicUrl
        : `${window.location.origin}${res.publicUrl}`;

      if (channel === 'LINK') {
        try {
          await navigator.clipboard.writeText(absoluteUrl);
          showToast(`Lien copié : ${absoluteUrl}`);
        } catch {
          showToast(`Lien : ${absoluteUrl}`);
        }
      } else if (channel === 'WHATSAPP') {
        if (res.waUrl) {
          window.open(res.waUrl, '_blank', 'noopener,noreferrer');
          showToast('WhatsApp ouvert — envoyez le message pour terminer.');
        } else {
          showToast('Numéro invalide : WhatsApp non ouvert.');
        }
      } else if (channel === 'EMAIL') {
        if (res.emailQueueMissing) {
          showToast('Email: file non configurée (RESEND_API_KEY manquant).');
        } else {
          showToast(`Email envoyé à ${shareGuest.email}.`);
        }
      }

      setShareGuest(null);
      await refetch();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'GUEST_EMAIL_MISSING') showToast('Cet invité n’a pas d’email.');
        else if (err.code === 'GUEST_PHONE_MISSING')
          showToast('Cet invité n’a pas de numéro WhatsApp.');
        else showToast('Erreur : envoi impossible.');
      } else {
        showToast('Erreur réseau.');
      }
    } finally {
      setSharingChannel(null);
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
            {stats.companionSum > 0
              ? `+ ${stats.companionSum} accompagnant${stats.companionSum > 1 ? 's' : ''} annoncé${stats.companionSum > 1 ? 's' : ''}`
              : stats.confirmed === 0
                ? 'Aucune réponse positive pour le moment.'
                : 'Aucun accompagnant annoncé.'}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">
            {stats.declined > 0 ? 'Déclinés' : 'En attente'}
          </div>
          <div
            className={`font-headings font-bold text-3xl mb-3 ${stats.declined > 0 ? 'text-danger' : 'text-warning'}`}
          >
            {stats.declined > 0 ? stats.declined : stats.pending}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.total === 0
              ? 'Ajoutez votre premier invité ci-dessous.'
              : stats.declined > 0
                ? `${stats.pending} encore en attente.`
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
              status={toRowStatus(g.invitation?.rsvpStatus)}
              companions={g.invitation?.companionCount ?? 0}
              table="—"
              index={i}
              onDelete={() => handleDelete(g.id)}
              onSend={() => handleInviteOpen(g.id)}
              deleting={deletingId === g.id || invitingId === g.id}
            />
          ))
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5 md:p-6">
        <h3 className="font-headings font-bold text-lg text-foreground mb-1">
          Partager les invitations
        </h3>
        <p className="text-sm text-muted-foreground">
          Cliquez sur l’icône{' '}
          <span className="inline-block align-middle">
            <Icon name="send" size={14} className="inline" />
          </span>{' '}
          à côté d’un invité : choisissez WhatsApp, email ou copie du lien dans la fenêtre qui
          s’ouvre.
        </p>
      </div>

      {/* Share dialog */}
      {shareGuest && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => !sharingChannel && setShareGuest(null)}
        >
          <div
            className="bg-card border border-border rounded-xl p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headings font-bold text-base text-foreground mb-1">
              Envoyer à {shareGuest.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Choisissez un canal pour partager l’invitation.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleShare('WHATSAPP')}
                disabled={!shareGuest.phone || sharingChannel !== null}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary text-left disabled:opacity-40 disabled:cursor-not-allowed"
                title={!shareGuest.phone ? 'Numéro manquant' : undefined}
              >
                <span className="text-xl">💬</span>
                <div className="flex-1">
                  <div className="text-sm font-body font-bold text-foreground">WhatsApp</div>
                  <div className="text-xs text-muted-foreground">
                    {shareGuest.phone ?? 'Numéro manquant'}
                  </div>
                </div>
                {sharingChannel === 'WHATSAPP' && <span className="text-xs">…</span>}
              </button>

              <button
                type="button"
                onClick={() => handleShare('EMAIL')}
                disabled={!shareGuest.email || sharingChannel !== null}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary text-left disabled:opacity-40 disabled:cursor-not-allowed"
                title={!shareGuest.email ? 'Email manquant' : undefined}
              >
                <span className="text-xl">📧</span>
                <div className="flex-1">
                  <div className="text-sm font-body font-bold text-foreground">Email</div>
                  <div className="text-xs text-muted-foreground">
                    {shareGuest.email ?? 'Email manquant'}
                  </div>
                </div>
                {sharingChannel === 'EMAIL' && <span className="text-xs">…</span>}
              </button>

              <button
                type="button"
                onClick={() => handleShare('LINK')}
                disabled={sharingChannel !== null}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-primary text-left disabled:opacity-40"
              >
                <span className="text-xl">🔗</span>
                <div className="flex-1">
                  <div className="text-sm font-body font-bold text-foreground">Copier le lien</div>
                  <div className="text-xs text-muted-foreground">À coller où vous voulez</div>
                </div>
                {sharingChannel === 'LINK' && <span className="text-xs">…</span>}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShareGuest(null)}
              disabled={sharingChannel !== null}
              className="mt-4 w-full py-2 text-sm text-muted-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-3 rounded-lg shadow-lg text-sm max-w-md break-words">
          {toast}
        </div>
      )}
    </AppLayout>
  );
}
