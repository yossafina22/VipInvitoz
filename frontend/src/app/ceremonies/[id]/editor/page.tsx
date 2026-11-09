'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { InvitationPreview } from '@/components/InvitationPreview';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';

type CeremonyType = 'MARIAGE' | 'BAPTEME' | 'ANNIVERSAIRE' | 'DEUIL' | 'AUTRE';
type Status = 'DRAFT' | 'ACTIVE' | 'PAST' | 'ARCHIVED';

interface Occasion {
  id: string;
  label: string;
  startsAt: string;
  durationMinutes: number | null;
  locationName: string;
  locationAddress: string;
  instructions: string | null;
  order: number;
}

interface Ceremony {
  id: string;
  type: CeremonyType;
  title: string;
  description: string;
  status: Status;
  musicLabel: string | null;
  musicUrl: string | null;
  coverImageUrl: string | null;
  occasions: Occasion[];
  _count?: { guests: number; invitations: number };
}

const EMOJI: Record<CeremonyType, string> = {
  MARIAGE: '💍',
  BAPTEME: '👶',
  ANNIVERSAIRE: '🎂',
  DEUIL: '🕯️',
  AUTRE: '✨',
};

const TYPE_LABEL: Record<CeremonyType, string> = {
  MARIAGE: 'Mariage',
  BAPTEME: 'Baptême',
  ANNIVERSAIRE: 'Anniversaire',
  DEUIL: 'Deuil',
  AUTRE: 'Autre',
};

const MUSIC_TRACKS = [
  'Jazz africain doux',
  'Kora traditionnelle',
  'Rythme moderne joyeux',
  'Silence',
] as const;

function splitIso(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mn}` };
}

function combineIso(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}:00`).toISOString();
}

function fmtHuman(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '—' };
  return {
    date: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h'),
  };
}

export default function InvitationEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ceremonyId = params.id;

  const [ceremony, setCeremony] = useState<Ceremony | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [editOccasion, setEditOccasion] = useState<Occasion | null>(null);
  const [showAddOccasion, setShowAddOccasion] = useState(false);
  const [busy, setBusy] = useState(false);

  // Draft state for top-level editable fields. Sync when ceremony loads.
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftType, setDraftType] = useState<CeremonyType>('MARIAGE');

  const refetch = useCallback(async () => {
    try {
      const res = await api<{ ceremony: Ceremony }>(`/api/ceremonies/${ceremonyId}`);
      setCeremony(res.ceremony);
      setDraftTitle(res.ceremony.title);
      setDraftDescription(res.ceremony.description);
      setDraftType(res.ceremony.type);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else if (err instanceof ApiError && err.status === 401) router.replace('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [ceremonyId, router]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const topDirty = useMemo(() => {
    if (!ceremony) return false;
    return (
      draftTitle.trim() !== ceremony.title ||
      draftDescription.trim() !== ceremony.description ||
      draftType !== ceremony.type
    );
  }, [ceremony, draftTitle, draftDescription, draftType]);

  async function saveTopFields() {
    if (!ceremony || !topDirty) return;
    if (draftTitle.trim().length === 0) return showToast('Le titre est obligatoire.');
    if (draftDescription.trim().length < 10)
      return showToast('La description doit faire au moins 10 caractères.');

    setBusy(true);
    try {
      const res = await api<{ ceremony: Ceremony }>(`/api/ceremonies/${ceremonyId}`, {
        method: 'PATCH',
        body: {
          title: draftTitle.trim(),
          description: draftDescription.trim(),
          type: draftType,
        },
      });
      setCeremony(res.ceremony);
      showToast('Modifications enregistrées.');
    } catch {
      showToast('Impossible d’enregistrer.');
    } finally {
      setBusy(false);
    }
  }

  async function selectMusic(label: string) {
    if (!ceremony) return;
    setBusy(true);
    try {
      const res = await api<{ ceremony: Ceremony }>(`/api/ceremonies/${ceremonyId}`, {
        method: 'PATCH',
        body: { musicLabel: label },
      });
      setCeremony(res.ceremony);
    } catch {
      showToast('Erreur lors de la sélection musicale.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteOccasion(occId: string) {
    if (!confirm('Supprimer cette occasion ?')) return;
    setBusy(true);
    try {
      await api(`/api/ceremonies/${ceremonyId}/occasions/${occId}`, { method: 'DELETE' });
      await refetch();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'OCCASION_LAST_REMAINING') {
        showToast('Chaque cérémonie doit garder au moins une occasion.');
      } else {
        showToast('Erreur lors de la suppression.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AppLayout pageTitle="Éditer l'invitation" tier="premium">
        <div className="min-h-[40vh] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </AppLayout>
    );
  }

  if (notFound || !ceremony) {
    return (
      <AppLayout pageTitle="Éditer l'invitation" tier="premium">
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <div className="text-4xl opacity-40">🔎</div>
          <p className="text-sm text-muted-foreground">Cérémonie introuvable.</p>
          <Link href="/ceremonies" className="text-sm text-primary font-medium">
            Retour aux cérémonies
          </Link>
        </div>
      </AppLayout>
    );
  }

  const firstOcc = ceremony.occasions[0];
  const firstHuman = firstOcc ? fmtHuman(firstOcc.startsAt) : { date: '—', time: '—' };

  return (
    <AppLayout pageTitle="Éditer l'invitation" tier="premium">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Left — Editable top-level + music */}
        <div className="flex flex-col gap-5">
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <PageHeader title="Détails principaux" subtitle="Titre, type, texte" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Titre</label>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">Type</label>
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as CeremonyType)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                {(Object.keys(TYPE_LABEL) as CeremonyType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">
                Description / ambiance
              </label>
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                rows={4}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                {draftDescription.trim().length} / 1000 caractères (min. 10).
              </p>
            </div>

            <button
              type="button"
              onClick={saveTopFields}
              disabled={!topDirty || busy}
              className="bg-primary text-primary-foreground font-body font-bold py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {busy ? 'Enregistrement…' : topDirty ? 'Enregistrer' : 'À jour'}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <PageHeader title="Musique de fond" subtitle="Choisir une ambiance" />
            <div className="flex flex-col gap-2 mt-3">
              {MUSIC_TRACKS.map((song) => {
                const active = ceremony.musicLabel === song;
                return (
                  <button
                    key={song}
                    type="button"
                    onClick={() => selectMusic(song)}
                    disabled={busy}
                    className={`p-3 rounded-lg border flex items-start gap-3 text-left transition-colors disabled:opacity-60 ${
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
                      <div className="font-body font-bold text-foreground truncate">{song}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              L’upload d’un fichier audio personnel arrive bientôt.
            </p>
          </div>
        </div>

        {/* Center — Live preview */}
        <div className="flex flex-col gap-4">
          <PageHeader title="Aperçu en direct" subtitle="Rendu mobile" />
          <div className="mx-auto w-full max-w-sm">
            <InvitationPreview
              emoji={EMOJI[ceremony.type]}
              title={draftTitle || ceremony.title}
              body={draftDescription || ceremony.description}
              date={firstHuman.date}
              time={firstHuman.time}
              location={firstOcc?.locationName ?? '—'}
              family=""
            />
          </div>
        </div>

        {/* Right — Occasions list + status */}
        <div className="flex flex-col gap-5">
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <PageHeader
                title="Lieux & dates"
                subtitle={`${ceremony.occasions.length} occasion${ceremony.occasions.length > 1 ? 's' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowAddOccasion(true)}
                disabled={busy}
                className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md flex items-center gap-1 font-bold disabled:opacity-50"
              >
                <Icon name="plus" size={12} />
                Ajouter
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {ceremony.occasions.map((o) => {
                const h = fmtHuman(o.startsAt);
                return (
                  <div
                    key={o.id}
                    className="border border-border rounded-lg p-3 flex flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-body font-bold text-sm text-foreground truncate">
                        {o.label}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditOccasion(o)}
                          disabled={busy}
                          aria-label="Modifier"
                          className="text-muted-foreground hover:text-primary disabled:opacity-40"
                        >
                          <Icon name="pencil" size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOccasion(o.id)}
                          disabled={busy}
                          aria-label="Supprimer"
                          className="text-muted-foreground hover:text-danger disabled:opacity-40"
                        >
                          <Icon name="trash-2" size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {h.date} à {h.time}
                    </div>
                    <div className="text-xs text-foreground truncate">{o.locationName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {o.locationAddress}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2">
            <div className="text-xs font-body text-muted-foreground">Statut</div>
            <div className="font-body font-bold text-sm text-foreground">
              {ceremony.status === 'DRAFT'
                ? 'Brouillon'
                : ceremony.status === 'ACTIVE'
                  ? 'Active'
                  : ceremony.status === 'PAST'
                    ? 'Passée'
                    : 'Archivée'}
            </div>
            <p className="text-xs text-muted-foreground">
              {ceremony._count?.guests ?? 0} invité
              {(ceremony._count?.guests ?? 0) > 1 ? 's' : ''} · {ceremony._count?.invitations ?? 0}{' '}
              invitation
              {(ceremony._count?.invitations ?? 0) > 1 ? 's' : ''} envoyée
              {(ceremony._count?.invitations ?? 0) > 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-secondary border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="font-body font-bold text-sm text-secondary-foreground">
              Étapes suivantes
            </div>
            <Link
              href="/guests"
              className="bg-primary text-primary-foreground text-center font-body font-bold py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              Gérer les invités →
            </Link>
            <Link
              href="/seating"
              className="bg-background border border-border text-center font-body font-bold py-2.5 rounded-lg text-sm hover:border-primary transition-colors"
            >
              Plan de table
            </Link>
          </div>
        </div>
      </div>

      {editOccasion && (
        <OccasionDialog
          mode="edit"
          initial={editOccasion}
          onClose={() => setEditOccasion(null)}
          onSave={async (patch) => {
            setBusy(true);
            try {
              await api(`/api/ceremonies/${ceremonyId}/occasions/${editOccasion.id}`, {
                method: 'PATCH',
                body: patch,
              });
              await refetch();
              setEditOccasion(null);
              showToast('Occasion mise à jour.');
            } catch {
              showToast('Erreur lors de la mise à jour.');
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {showAddOccasion && (
        <OccasionDialog
          mode="create"
          onClose={() => setShowAddOccasion(false)}
          onSave={async (payload) => {
            setBusy(true);
            try {
              await api(`/api/ceremonies/${ceremonyId}/occasions`, {
                method: 'POST',
                body: payload,
              });
              await refetch();
              setShowAddOccasion(false);
              showToast('Occasion ajoutée.');
            } catch {
              showToast('Erreur lors de l’ajout.');
            } finally {
              setBusy(false);
            }
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-4 py-3 rounded-lg shadow-lg text-sm max-w-md break-words">
          {toast}
        </div>
      )}
    </AppLayout>
  );
}

interface OccasionPayload {
  label: string;
  startsAt: string;
  locationName: string;
  locationAddress: string;
}

function OccasionDialog(props: {
  mode: 'create' | 'edit';
  initial?: Occasion;
  onClose: () => void;
  onSave: (payload: OccasionPayload) => void | Promise<void>;
}) {
  const { mode, initial, onClose, onSave } = props;
  const now = useMemo(() => splitIso(initial?.startsAt ?? new Date().toISOString()), [initial]);

  const [label, setLabel] = useState(initial?.label ?? 'Cérémonie');
  const [date, setDate] = useState(now.date);
  const [time, setTime] = useState(now.time || '15:00');
  const [locationName, setLocationName] = useState(initial?.locationName ?? '');
  const [locationAddress, setLocationAddress] = useState(initial?.locationAddress ?? '');
  const [saving, setSaving] = useState(false);

  const valid =
    label.trim().length > 0 &&
    date.length === 10 &&
    locationName.trim().length > 0 &&
    locationAddress.trim().length > 0;

  async function handleSave() {
    if (!valid || saving) return;
    setSaving(true);
    await onSave({
      label: label.trim(),
      startsAt: combineIso(date, time),
      locationName: locationName.trim(),
      locationAddress: locationAddress.trim(),
    });
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-card border border-border rounded-xl p-5 max-w-md w-full flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-headings font-bold text-base text-foreground">
          {mode === 'create' ? 'Nouvelle occasion' : 'Modifier l’occasion'}
        </h3>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Nom (ex: Cérémonie civile)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="w-28 flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Heure</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Lieu (nom court)</label>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Hôtel Terrou-Bi"
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Adresse complète</label>
          <input
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder="Route de la Corniche, Dakar"
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2 text-sm text-muted-foreground"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!valid || saving}
            className="flex-1 bg-primary text-primary-foreground font-body font-bold py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : mode === 'create' ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
