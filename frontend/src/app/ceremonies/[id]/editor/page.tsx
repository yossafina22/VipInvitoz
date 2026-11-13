'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { InvitationPreview } from '@/components/InvitationPreview';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';
import { uploadFile } from '@/lib/upload-client';

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

interface InvitationBlock {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'quote' | 'cta';
  text: string;
}
interface InvitationJson {
  palette: 'wax' | 'gold' | 'ivory' | 'indigo';
  blocks: InvitationBlock[];
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
  invitationJson: InvitationJson | null;
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
  const [generating, setGenerating] = useState(false);
  const [aiCreditsRemaining, setAiCreditsRemaining] = useState<number | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

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

  async function handleCoverUpload(file: File) {
    if (!ceremony || uploadingCover) return;
    setUploadingCover(true);
    try {
      const uploaded = await uploadFile(file);
      const res = await api<{ ceremony: Ceremony }>(`/api/ceremonies/${ceremonyId}`, {
        method: 'PATCH',
        body: { coverImageUrl: uploaded.url },
      });
      setCeremony(res.ceremony);
      showToast('Photo de couverture ajoutée.');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'STORAGE_NOT_CONFIGURED') {
          showToast('Upload non configuré côté serveur (Cloudinary manquant).');
        } else if (err.code === 'FILE_TOO_LARGE') {
          showToast('Fichier trop volumineux (max 10 Mo).');
        } else if (err.code === 'INVALID_MIME' || err.code === 'MAGIC_BYTE_MISMATCH') {
          showToast('Format non pris en charge. Utilisez JPG, PNG ou WebP.');
        } else {
          showToast('Erreur lors de l’upload.');
        }
      } else {
        showToast('Erreur réseau lors de l’upload.');
      }
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleCoverRemove() {
    if (!ceremony || uploadingCover) return;
    if (!confirm('Retirer la photo de couverture ?')) return;
    setUploadingCover(true);
    try {
      const res = await api<{ ceremony: Ceremony }>(`/api/ceremonies/${ceremonyId}`, {
        method: 'PATCH',
        body: { coverImageUrl: null },
      });
      setCeremony(res.ceremony);
      showToast('Photo retirée.');
    } catch {
      showToast('Erreur lors du retrait.');
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGenerate() {
    if (!ceremony || generating) return;
    if (ceremony.description.trim().length < 10) {
      return showToast('Enregistrez d’abord une description (10 caractères minimum).');
    }
    if (ceremony.occasions.length === 0) {
      return showToast('Ajoutez au moins une occasion avant de générer.');
    }
    setGenerating(true);
    try {
      const res = await api<{
        ceremony: Ceremony;
        aiCreditsRemaining: number;
      }>(`/api/ceremonies/${ceremonyId}/ai-generate`, {
        method: 'POST',
        body: { locale: 'fr' },
      });
      setCeremony(res.ceremony);
      setAiCreditsRemaining(res.aiCreditsRemaining);
      showToast('Invitation générée avec succès.');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'AI_QUOTA_EXCEEDED') {
          showToast('Crédits IA épuisés. Passez en VIP pour la génération illimitée.');
        } else if (err.code === 'AI_NOT_CONFIGURED') {
          showToast('IA non configurée côté serveur (crédit non débité).');
        } else if (err.code === 'AI_PROVIDER_AUTH') {
          showToast('Clé API Anthropic invalide (crédit remboursé).');
        } else if (err.code === 'AI_PROVIDER_RATE_LIMITED') {
          showToast('Trop de requêtes — réessayez (crédit remboursé).');
        } else if (err.code === 'AI_PROVIDER_UNAVAILABLE') {
          showToast('Service IA indisponible — réessayez plus tard (crédit remboursé).');
        } else if (err.code === 'AI_CALL_FAILED') {
          showToast('La génération a échoué. Réessayez.');
        } else if (err.code === 'CEREMONY_NO_OCCASIONS') {
          showToast('Ajoutez au moins une occasion avant de générer.');
        } else {
          showToast('Erreur lors de la génération.');
        }
      } else {
        showToast('Erreur réseau.');
      }
    } finally {
      setGenerating(false);
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
        {/* Left — AI panel + top-level + music */}
        <div className="flex flex-col gap-5">
          <div className="bg-gold-light border border-gold rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Icon name="sparkles" size={20} className="text-gold mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-headings font-bold text-sm text-foreground">Génération IA</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ceremony?.invitationJson
                    ? 'Invitation générée. Régénérez pour ré-essayer avec la description actuelle.'
                    : 'Transformez votre description en texte d’invitation personnalisé.'}
                </p>
                {aiCreditsRemaining !== null && aiCreditsRemaining !== -1 && (
                  <p className="text-xs text-gold mt-1 font-bold">
                    {aiCreditsRemaining} crédit{aiCreditsRemaining > 1 ? 's' : ''} IA restant
                    {aiCreditsRemaining > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || busy || topDirty}
              title={topDirty ? 'Enregistrez d’abord les modifications' : undefined}
              className="bg-gold text-background font-body font-bold py-2.5 rounded-lg text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-pulse">●</span>
                  Génération en cours…
                </>
              ) : ceremony?.invitationJson ? (
                '🔁 Régénérer'
              ) : (
                '✨ Générer avec l’IA'
              )}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <PageHeader title="Détails principaux" subtitle="Image, titre, type, texte" />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-body font-medium text-muted-foreground">
                Photo de couverture
              </label>
              {ceremony.coverImageUrl ? (
                <div className="relative group">
                  <div
                    className="relative w-full h-52 rounded-lg overflow-hidden border border-border bg-muted"
                    style={{
                      backgroundImage: `url(${ceremony.coverImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div
                      className="absolute inset-0 backdrop-blur-2xl bg-background/30"
                      aria-hidden
                    />
                    <img
                      src={ceremony.coverImageUrl}
                      alt="Couverture"
                      className="relative w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <label className="bg-background text-foreground text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer">
                      Remplacer
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleCoverUpload(f);
                          e.target.value = '';
                        }}
                        disabled={uploadingCover || busy}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleCoverRemove}
                      disabled={uploadingCover || busy}
                      className="bg-danger text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block w-full bg-input border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:bg-secondary hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleCoverUpload(f);
                      e.target.value = '';
                    }}
                    disabled={uploadingCover || busy}
                  />
                  <Icon
                    name="image-plus"
                    size={24}
                    className="text-muted-foreground mx-auto mb-1"
                  />
                  <div className="text-xs text-foreground font-bold">
                    {uploadingCover ? 'Upload en cours…' : 'Cliquez pour ajouter'}
                  </div>
                  <div className="text-xs text-muted-foreground">JPG, PNG ou WebP — max 10 Mo</div>
                </label>
              )}
            </div>

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
          <PageHeader
            title={ceremony.invitationJson ? 'Invitation générée' : 'Aperçu en direct'}
            subtitle={
              ceremony.invitationJson
                ? `Palette ${ceremony.invitationJson.palette}`
                : 'Rendu mobile'
            }
          />
          <div className="mx-auto w-full max-w-sm">
            {ceremony.invitationJson ? (
              <GeneratedInvitation
                invitation={ceremony.invitationJson}
                dateLabel={firstHuman.date}
                timeLabel={firstHuman.time}
                location={firstOcc?.locationName ?? '—'}
                coverImageUrl={ceremony.coverImageUrl}
              />
            ) : (
              <InvitationPreview
                emoji={EMOJI[ceremony.type]}
                title={draftTitle || ceremony.title}
                body={draftDescription || ceremony.description}
                date={firstHuman.date}
                time={firstHuman.time}
                location={firstOcc?.locationName ?? '—'}
                family=""
              />
            )}
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
              href={`/ceremonies/${ceremonyId}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold text-background text-center font-body font-bold py-2.5 rounded-lg text-sm hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="eye" size={14} />
              Voir en tant qu&apos;invité
            </Link>
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

const PALETTE_STYLES: Record<
  InvitationJson['palette'],
  { bg: string; accent: string; body: string }
> = {
  wax: { bg: 'bg-amber-50', accent: 'text-amber-800', body: 'text-amber-900' },
  gold: { bg: 'bg-yellow-50', accent: 'text-yellow-800', body: 'text-yellow-900' },
  ivory: { bg: 'bg-stone-50', accent: 'text-stone-700', body: 'text-stone-900' },
  indigo: { bg: 'bg-indigo-50', accent: 'text-indigo-800', body: 'text-indigo-900' },
};

function GeneratedInvitation(props: {
  invitation: InvitationJson;
  dateLabel: string;
  timeLabel: string;
  location: string;
  coverImageUrl?: string | null;
}) {
  const { invitation, dateLabel, timeLabel, location, coverImageUrl } = props;
  const s = PALETTE_STYLES[invitation.palette] ?? PALETTE_STYLES.ivory;
  return (
    <div
      className={`rounded-2xl ${s.bg} border border-border overflow-hidden flex flex-col shadow-sm`}
    >
      {coverImageUrl && <img src={coverImageUrl} alt="" className="w-full h-40 object-cover" />}
      <div className="flex flex-col gap-3 p-6">
        {invitation.blocks.map((b) => {
          if (b.type === 'title') {
            return (
              <h2
                key={b.id}
                className={`font-headings font-bold text-xl md:text-2xl ${s.accent} text-center`}
              >
                {b.text}
              </h2>
            );
          }
          if (b.type === 'subtitle') {
            return (
              <h3
                key={b.id}
                className={`font-headings text-sm md:text-base ${s.accent} text-center uppercase tracking-wide`}
              >
                {b.text}
              </h3>
            );
          }
          if (b.type === 'quote') {
            return (
              <blockquote
                key={b.id}
                className={`border-l-2 border-current pl-3 italic text-sm ${s.body}`}
              >
                {b.text}
              </blockquote>
            );
          }
          if (b.type === 'cta') {
            return (
              <div key={b.id} className="pt-2 text-center">
                <span
                  className={`inline-block border border-current ${s.accent} px-4 py-2 rounded-full text-sm font-bold`}
                >
                  {b.text}
                </span>
              </div>
            );
          }
          return (
            <p key={b.id} className={`text-sm leading-relaxed ${s.body}`}>
              {b.text}
            </p>
          );
        })}
        <div className={`mt-2 pt-3 border-t border-current/20 text-center text-xs ${s.body}`}>
          <div className="font-bold">{dateLabel}</div>
          <div>
            {timeLabel} — {location}
          </div>
        </div>
      </div>
    </div>
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
