'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { InvitationPreview } from '@/components/InvitationPreview';
import { PalettePicker } from '@/components/PalettePicker';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';
import { uploadFile } from '@/lib/upload-client';
import type { InvitationPalette, PaletteId } from '@/lib/invitation-palettes';
import { paletteStyle, resolvePalette } from '@/lib/invitation-palettes';

const CEREMONY_TYPES = ['MARIAGE', 'BAPTEME', 'ANNIVERSAIRE', 'DEUIL', 'AUTRE'] as const;
type CeremonyType = (typeof CEREMONY_TYPES)[number];
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
  invitationPalette: PaletteId;
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

// `value` is persisted as Ceremony.musicLabel — keep it stable so existing rows still match.
const MUSIC_TRACKS = [
  { key: 'softJazz', value: 'Jazz africain doux' },
  { key: 'kora', value: 'Kora traditionnelle' },
  { key: 'modern', value: 'Rythme moderne joyeux' },
  { key: 'silence', value: 'Silence' },
] as const;

const LOCALE_TAG: Record<string, string> = { fr: 'fr-FR', en: 'en-US' };
const AI_LOCALES = ['fr', 'en', 'de'] as const;
type AiLocale = (typeof AI_LOCALES)[number];

function toAiLocale(locale: string): AiLocale {
  return (AI_LOCALES as readonly string[]).includes(locale) ? (locale as AiLocale) : 'fr';
}

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

function fmtHuman(iso: string, locale: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '—' };
  const tag = LOCALE_TAG[locale] ?? 'fr-FR';
  const time =
    locale === 'fr'
      ? d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')
      : d.toLocaleTimeString(tag, { hour: 'numeric', minute: '2-digit' });
  return {
    date: d.toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' }),
    time,
  };
}

export default function InvitationEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('ceremonies');
  const tPalettes = useTranslations('palettes');
  const locale = useLocale();
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
    if (draftTitle.trim().length === 0) return showToast(t('editor.toasts.titleRequired'));
    if (draftDescription.trim().length < 10)
      return showToast(t('editor.toasts.descriptionTooShort'));

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
      showToast(t('editor.toasts.saved'));
    } catch {
      showToast(t('editor.toasts.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function handlePaletteChange(id: PaletteId) {
    if (!ceremony || busy) return;
    if (ceremony.invitationPalette === id) return;
    // Optimistic — swap immediately so the picker feels snappy; roll back on error.
    const prev = ceremony.invitationPalette;
    setCeremony({ ...ceremony, invitationPalette: id });
    try {
      const res = await api<{ ceremony: Ceremony }>(`/api/ceremonies/${ceremonyId}`, {
        method: 'PATCH',
        body: { invitationPalette: id },
      });
      setCeremony(res.ceremony);
    } catch {
      setCeremony({ ...ceremony, invitationPalette: prev });
      showToast(t('editor.toasts.paletteFailed'));
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
      showToast(t('editor.toasts.musicFailed'));
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
      showToast(t('editor.toasts.coverAdded'));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'STORAGE_NOT_CONFIGURED') {
          showToast(t('editor.toasts.uploadNotConfigured'));
        } else if (err.code === 'FILE_TOO_LARGE') {
          showToast(t('editor.toasts.fileTooLarge'));
        } else if (err.code === 'INVALID_MIME' || err.code === 'MAGIC_BYTE_MISMATCH') {
          showToast(t('editor.toasts.invalidFormat'));
        } else {
          showToast(t('editor.toasts.uploadFailed'));
        }
      } else {
        showToast(t('editor.toasts.uploadNetwork'));
      }
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleCoverRemove() {
    if (!ceremony || uploadingCover) return;
    if (!confirm(t('editor.confirm.removeCover'))) return;
    setUploadingCover(true);
    try {
      const res = await api<{ ceremony: Ceremony }>(`/api/ceremonies/${ceremonyId}`, {
        method: 'PATCH',
        body: { coverImageUrl: null },
      });
      setCeremony(res.ceremony);
      showToast(t('editor.toasts.coverRemoved'));
    } catch {
      showToast(t('editor.toasts.coverRemoveFailed'));
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGenerate() {
    if (!ceremony || generating) return;
    if (ceremony.description.trim().length < 10) {
      return showToast(t('editor.toasts.needDescription'));
    }
    if (ceremony.occasions.length === 0) {
      return showToast(t('editor.toasts.needOccasion'));
    }
    setGenerating(true);
    try {
      const res = await api<{
        ceremony: Ceremony;
        aiCreditsRemaining: number;
      }>(`/api/ceremonies/${ceremonyId}/ai-generate`, {
        method: 'POST',
        body: { locale: toAiLocale(locale) },
      });
      setCeremony(res.ceremony);
      setAiCreditsRemaining(res.aiCreditsRemaining);
      showToast(t('editor.toasts.generated'));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'AI_QUOTA_EXCEEDED') {
          showToast(t('editor.toasts.aiQuota'));
        } else if (err.code === 'AI_NOT_CONFIGURED') {
          showToast(t('editor.toasts.aiNotConfigured'));
        } else if (err.code === 'AI_PROVIDER_AUTH') {
          showToast(t('editor.toasts.aiAuth'));
        } else if (err.code === 'AI_PROVIDER_RATE_LIMITED') {
          showToast(t('editor.toasts.aiRateLimited'));
        } else if (err.code === 'AI_PROVIDER_UNAVAILABLE') {
          showToast(t('editor.toasts.aiUnavailable'));
        } else if (err.code === 'AI_CALL_FAILED') {
          showToast(t('editor.toasts.aiFailed'));
        } else if (err.code === 'CEREMONY_NO_OCCASIONS') {
          showToast(t('editor.toasts.needOccasion'));
        } else {
          showToast(t('editor.toasts.aiGeneric'));
        }
      } else {
        showToast(t('editor.toasts.network'));
      }
    } finally {
      setGenerating(false);
    }
  }

  async function deleteOccasion(occId: string) {
    if (!confirm(t('editor.confirm.deleteOccasion'))) return;
    setBusy(true);
    try {
      await api(`/api/ceremonies/${ceremonyId}/occasions/${occId}`, { method: 'DELETE' });
      await refetch();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'OCCASION_LAST_REMAINING') {
        showToast(t('editor.toasts.lastOccasion'));
      } else {
        showToast(t('editor.toasts.deleteFailed'));
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AppLayout pageTitle={t('editor.pageTitle')} tier="premium">
        <div className="min-h-[40vh] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('editor.loading')}</p>
        </div>
      </AppLayout>
    );
  }

  if (notFound || !ceremony) {
    return (
      <AppLayout pageTitle={t('editor.pageTitle')} tier="premium">
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <div className="text-4xl opacity-40">🔎</div>
          <p className="text-sm text-muted-foreground">{t('editor.notFound')}</p>
          <Link href="/ceremonies" className="text-sm text-primary font-medium">
            {t('editor.backToList')}
          </Link>
        </div>
      </AppLayout>
    );
  }

  const firstOcc = ceremony.occasions[0];
  const firstHuman = firstOcc ? fmtHuman(firstOcc.startsAt, locale) : { date: '—', time: '—' };

  return (
    <AppLayout pageTitle={t('editor.pageTitle')} tier="premium">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Left — AI panel + top-level + music */}
        <div className="flex flex-col gap-5">
          <div className="bg-gold-light border border-gold rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Icon name="sparkles" size={20} className="text-gold mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="font-headings font-bold text-sm text-foreground">
                  {t('editor.ai.title')}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ceremony?.invitationJson
                    ? t('editor.ai.descGenerated')
                    : t('editor.ai.descEmpty')}
                </p>
                {aiCreditsRemaining !== null && aiCreditsRemaining !== -1 && (
                  <p className="text-xs text-gold mt-1 font-bold">
                    {t('editor.ai.creditsRemaining', { count: aiCreditsRemaining })}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || busy || topDirty}
              title={topDirty ? t('editor.ai.saveFirst') : undefined}
              className="bg-gold text-background font-body font-bold py-2.5 rounded-lg text-sm hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-pulse">●</span>
                  {t('editor.ai.generating')}
                </>
              ) : ceremony?.invitationJson ? (
                t('editor.ai.regenerate')
              ) : (
                t('editor.ai.generate')
              )}
            </button>
          </div>

          <PalettePicker
            value={ceremony.invitationPalette}
            onChange={handlePaletteChange}
            locked={ceremony.type === 'DEUIL'}
            disabled={busy}
          />

          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <PageHeader title={t('editor.details.title')} subtitle={t('editor.details.subtitle')} />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-body font-medium text-muted-foreground">
                {t('editor.details.coverLabel')}
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
                      alt={t('editor.details.coverAlt')}
                      className="relative w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <label className="bg-background text-foreground text-xs font-bold px-3 py-1.5 rounded-md cursor-pointer">
                      {t('editor.details.replace')}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
                      {t('editor.details.remove')}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block w-full bg-input border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:bg-secondary hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
                    {uploadingCover
                      ? t('editor.details.uploading')
                      : t('editor.details.clickToAdd')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('editor.details.formats')}</div>
                </label>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">
                {t('editor.details.titleLabel')}
              </label>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">
                {t('editor.details.typeLabel')}
              </label>
              <select
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as CeremonyType)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                {CEREMONY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(`types.${value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body font-medium text-muted-foreground">
                {t('editor.details.descriptionLabel')}
              </label>
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                rows={4}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                {t('editor.details.charCount', { count: draftDescription.trim().length })}
              </p>
            </div>

            <button
              type="button"
              onClick={saveTopFields}
              disabled={!topDirty || busy}
              className="bg-primary text-primary-foreground font-body font-bold py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {busy
                ? t('editor.details.saving')
                : topDirty
                  ? t('editor.details.save')
                  : t('editor.details.upToDate')}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <PageHeader title={t('editor.music.title')} subtitle={t('editor.music.subtitle')} />
            <div className="flex flex-col gap-2 mt-3">
              {MUSIC_TRACKS.map((track) => {
                const active = ceremony.musicLabel === track.value;
                return (
                  <button
                    key={track.key}
                    type="button"
                    onClick={() => selectMusic(track.value)}
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
                      <div className="font-body font-bold text-foreground truncate">
                        {t(`editor.music.tracks.${track.key}`)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{t('editor.music.comingSoon')}</p>
          </div>
        </div>

        {/* Center — Live preview */}
        <div className="flex flex-col gap-4">
          <PageHeader
            title={
              ceremony.invitationJson
                ? t('editor.preview.generatedTitle')
                : t('editor.preview.liveTitle')
            }
            subtitle={
              ceremony.invitationJson
                ? t('editor.preview.paletteSubtitle', {
                    name: tPalettes(`items.${resolvePalette(ceremony.invitationPalette).id}.name`),
                  })
                : t('editor.preview.mobileSubtitle')
            }
          />
          <div className="mx-auto w-full max-w-sm">
            {ceremony.invitationJson ? (
              <GeneratedInvitation
                invitation={ceremony.invitationJson}
                userPalette={resolvePalette(ceremony.invitationPalette)}
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
                {...(ceremony.coverImageUrl ? { coverSrc: ceremony.coverImageUrl } : {})}
              />
            )}
          </div>
        </div>

        {/* Right — Occasions list + status */}
        <div className="flex flex-col gap-5">
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <PageHeader
                title={t('editor.occasions.title')}
                subtitle={t('editor.occasions.count', { count: ceremony.occasions.length })}
              />
              <button
                type="button"
                onClick={() => setShowAddOccasion(true)}
                disabled={busy}
                className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md flex items-center gap-1 font-bold disabled:opacity-50"
              >
                <Icon name="plus" size={12} />
                {t('editor.occasions.add')}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {ceremony.occasions.map((o) => {
                const h = fmtHuman(o.startsAt, locale);
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
                          aria-label={t('editor.occasions.edit')}
                          className="text-muted-foreground hover:text-primary disabled:opacity-40"
                        >
                          <Icon name="pencil" size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOccasion(o.id)}
                          disabled={busy}
                          aria-label={t('editor.occasions.delete')}
                          className="text-muted-foreground hover:text-danger disabled:opacity-40"
                        >
                          <Icon name="trash-2" size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('editor.occasions.dateAtTime', { date: h.date, time: h.time })}
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
            <div className="text-xs font-body text-muted-foreground">{t('editor.statusLabel')}</div>
            <div className="font-body font-bold text-sm text-foreground">
              {t(`status.${ceremony.status}`)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('editor.statsLine', {
                guests: ceremony._count?.guests ?? 0,
                sent: ceremony._count?.invitations ?? 0,
              })}
            </p>
          </div>

          <div className="bg-secondary border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="font-body font-bold text-sm text-secondary-foreground">
              {t('editor.nextSteps.title')}
            </div>
            <Link
              href={`/ceremonies/${ceremonyId}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gold text-background text-center font-body font-bold py-2.5 rounded-lg text-sm hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="eye" size={14} />
              {t('editor.nextSteps.viewAsGuest')}
            </Link>
            <Link
              href="/guests"
              className="bg-primary text-primary-foreground text-center font-body font-bold py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              {t('editor.nextSteps.manageGuests')}
            </Link>
            <Link
              href="/seating"
              className="bg-background border border-border text-center font-body font-bold py-2.5 rounded-lg text-sm hover:border-primary transition-colors"
            >
              {t('editor.nextSteps.seating')}
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
              showToast(t('editor.toasts.occasionUpdated'));
            } catch {
              showToast(t('editor.toasts.occasionUpdateFailed'));
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
              showToast(t('editor.toasts.occasionAdded'));
            } catch {
              showToast(t('editor.toasts.occasionAddFailed'));
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

function GeneratedInvitation(props: {
  invitation: InvitationJson;
  userPalette: InvitationPalette;
  dateLabel: string;
  timeLabel: string;
  location: string;
  coverImageUrl?: string | null;
}) {
  const { invitation, userPalette, dateLabel, timeLabel, location, coverImageUrl } = props;
  return (
    <div
      className="rounded-2xl border border-border overflow-hidden flex flex-col shadow-sm"
      style={{
        ...paletteStyle(userPalette),
        backgroundColor: 'var(--inv-surface)',
        color: 'var(--inv-text)',
      }}
    >
      {coverImageUrl && <img src={coverImageUrl} alt="" className="block w-full h-auto" />}
      <div className="flex flex-col gap-3 p-6">
        {invitation.blocks.map((b) => {
          if (b.type === 'title') {
            return (
              <h2
                key={b.id}
                className="font-headings font-bold text-xl md:text-2xl text-center"
                style={{ color: 'var(--inv-primary)' }}
              >
                {b.text}
              </h2>
            );
          }
          if (b.type === 'subtitle') {
            return (
              <h3
                key={b.id}
                className="font-headings text-sm md:text-base text-center uppercase tracking-wide"
                style={{ color: 'var(--inv-gold)' }}
              >
                {b.text}
              </h3>
            );
          }
          if (b.type === 'quote') {
            return (
              <blockquote
                key={b.id}
                className="border-l-2 pl-3 italic text-sm"
                style={{ borderColor: 'var(--inv-gold)', color: 'var(--inv-text-muted)' }}
              >
                {b.text}
              </blockquote>
            );
          }
          if (b.type === 'cta') {
            return (
              <div key={b.id} className="pt-2 text-center">
                <span
                  className="inline-block border px-4 py-2 rounded-full text-sm font-bold"
                  style={{ borderColor: 'var(--inv-primary)', color: 'var(--inv-primary)' }}
                >
                  {b.text}
                </span>
              </div>
            );
          }
          return (
            <p key={b.id} className="text-sm leading-relaxed" style={{ color: 'var(--inv-text)' }}>
              {b.text}
            </p>
          );
        })}
        <div
          className="mt-2 pt-3 border-t text-center text-xs"
          style={{ borderColor: 'var(--inv-gold)', color: 'var(--inv-text-muted)' }}
        >
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
  const t = useTranslations('ceremonies.editor.dialog');
  const now = useMemo(() => splitIso(initial?.startsAt ?? new Date().toISOString()), [initial]);

  const [label, setLabel] = useState(initial?.label ?? t('defaultLabel'));
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
          {mode === 'create' ? t('createTitle') : t('editTitle')}
        </h3>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">{t('nameLabel')}</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">{t('dateLabel')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="w-28 flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">{t('timeLabel')}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">{t('locationNameLabel')}</label>
          <input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder={t('locationNamePlaceholder')}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">{t('addressLabel')}</label>
          <input
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            placeholder={t('addressPlaceholder')}
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
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!valid || saving}
            className="flex-1 bg-primary text-primary-foreground font-body font-bold py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? t('saving') : mode === 'create' ? t('add') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
