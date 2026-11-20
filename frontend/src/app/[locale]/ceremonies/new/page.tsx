'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { StepIndicator } from '@/components/StepIndicator';
import { FormField } from '@/components/FormField';
import { InvitationPreview } from '@/components/InvitationPreview';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';
import { uploadFile } from '@/lib/upload-client';

const STEP_KEYS = ['details', 'aiBrief', 'preview', 'guests'] as const;

const CEREMONY_TYPES = ['MARIAGE', 'BAPTEME', 'ANNIVERSAIRE', 'DEUIL', 'AUTRE'] as const;
type CeremonyType = (typeof CEREMONY_TYPES)[number];

const EMOJI: Record<CeremonyType, string> = {
  MARIAGE: '💍',
  BAPTEME: '👶',
  ANNIVERSAIRE: '🎂',
  DEUIL: '🕯️',
  AUTRE: '✨',
};

const LOCALE_TAG: Record<string, string> = { fr: 'fr-FR', en: 'en-US' };

function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatHumanDate(isoDate: string, localeTag: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatHumanTime(hhmm: string, locale: string, localeTag: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':');
  if (!h) return hhmm;
  if (locale === 'fr') return `${h}h${m ?? '00'}`;
  const d = new Date(2000, 0, 1, Number(h), Number(m ?? '0'));
  if (Number.isNaN(d.getTime())) return hhmm;
  return d.toLocaleTimeString(localeTag, { hour: 'numeric', minute: '2-digit' });
}

export default function CreateCeremonyPage() {
  const router = useRouter();
  const t = useTranslations('ceremonies');
  const locale = useLocale();
  const localeTag = LOCALE_TAG[locale] ?? 'fr-FR';

  const [type, setType] = useState<CeremonyType>('MARIAGE');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [time, setTime] = useState('15:00');
  const [place, setPlace] = useState('');
  const [aiBrief, setAiBrief] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const steps = STEP_KEYS.map((key) => t(`new.steps.${key}`));

  async function handleCoverPick(file: File) {
    setError(null);
    setUploadingCover(true);
    try {
      const uploaded = await uploadFile(file);
      setCoverImageUrl(uploaded.url);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'STORAGE_NOT_CONFIGURED')
          setError(t('new.uploadErrors.STORAGE_NOT_CONFIGURED'));
        else if (err.code === 'FILE_TOO_LARGE') setError(t('new.uploadErrors.FILE_TOO_LARGE'));
        else if (err.code === 'INVALID_MIME' || err.code === 'MAGIC_BYTE_MISMATCH')
          setError(t('new.uploadErrors.INVALID_FORMAT'));
        else setError(t('new.uploadErrors.generic'));
      } else {
        setError(t('new.uploadErrors.network'));
      }
    } finally {
      setUploadingCover(false);
    }
  }

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 0 &&
      date.length === 10 &&
      place.trim().length > 0 &&
      aiBrief.trim().length >= 10
    );
  }, [title, date, place, aiBrief]);

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);

    // Build ISO timestamp from date + time (local timezone).
    const startsAt = new Date(`${date}T${time || '00:00'}:00`).toISOString();
    const locationName = (place.split(',')[0] ?? place).trim();
    const locationAddress = place.trim();

    try {
      const res = await api<{ ceremony: { id: string } }>('/api/ceremonies', {
        method: 'POST',
        body: {
          type,
          title: title.trim(),
          description: aiBrief.trim(),
          occasions: [
            {
              label: t(`defaultOccasionLabel.${type}`),
              startsAt,
              locationName,
              locationAddress,
            },
          ],
          ...(coverImageUrl ? { coverImageUrl } : {}),
        },
      });
      router.push(`/ceremonies/${res.ceremony.id}/editor`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CEREMONY_LIMIT_REACHED') {
          setError(
            typeof err.body?.message === 'string'
              ? (err.body.message as string)
              : t('new.errors.limitReached'),
          );
        } else if (err.status === 401) {
          router.push('/auth/login?next=/ceremonies/new');
          return;
        } else {
          setError(
            typeof err.body?.message === 'string'
              ? (err.body.message as string)
              : t('new.errors.generic'),
          );
        }
      } else {
        setError(t('new.errors.network'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle={t('new.pageTitle')} tier="premium">
      <div className="mb-6">
        <StepIndicator steps={steps} currentStep={1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left — Form */}
        <div className="flex flex-col gap-5">
          <PageHeader title={t('new.formTitle')} subtitle={t('new.formSubtitle')} />

          <div className="bg-card border border-border rounded-xl p-5 md:p-6 flex flex-col gap-5">
            <div>
              <label className="text-sm font-body font-medium text-foreground block mb-2">
                {t('new.cover.label')}
              </label>
              {coverImageUrl ? (
                <div className="relative group">
                  <img
                    src={coverImageUrl}
                    alt={t('new.cover.alt')}
                    className="w-full h-40 object-cover rounded-xl border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl(null)}
                    className="absolute top-2 right-2 bg-background/90 text-foreground text-xs font-bold px-2 py-1 rounded-md border border-border"
                  >
                    {t('new.cover.remove')}
                  </button>
                </div>
              ) : (
                <label className="w-full bg-input border-2 border-dashed border-border rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-40 hover:bg-secondary hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleCoverPick(f);
                      e.target.value = '';
                    }}
                    disabled={uploadingCover || submitting}
                  />
                  <Icon name="image-plus" size={32} className="text-muted-foreground mb-2" />
                  <div className="text-sm font-body text-foreground mb-1">
                    {uploadingCover ? t('new.cover.uploading') : t('new.cover.pick')}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('new.cover.formats')}</div>
                </label>
              )}
              <p className="text-xs text-muted-foreground mt-2">{t('new.cover.hint')}</p>
            </div>

            <div className="border-t border-border pt-5">
              <FormField
                name="type"
                label={t('new.typeLabel')}
                type="select"
                value={type}
                onChange={(v) => setType(v as CeremonyType)}
                options={CEREMONY_TYPES.map((value) => ({ value, label: t(`types.${value}`) }))}
                required
              />
            </div>
            <FormField
              name="title"
              label={t('new.titleLabel')}
              placeholder={t('new.titlePlaceholder')}
              value={title}
              onChange={setTitle}
              required
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label htmlFor="date" className="text-sm font-body font-medium text-foreground">
                  {t('new.dateLabel')}
                  <span className="text-primary ml-1">*</span>
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/30"
                />
              </div>
              <div className="sm:w-36 flex flex-col gap-1.5">
                <label htmlFor="time" className="text-sm font-body font-medium text-foreground">
                  {t('new.timeLabel')}
                </label>
                <input
                  id="time"
                  name="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/30"
                />
              </div>
            </div>
            <FormField
              name="place"
              label={t('new.placeLabel')}
              placeholder={t('new.placePlaceholder')}
              value={place}
              onChange={setPlace}
              required
              hint={t('new.placeHint')}
            />

            <div className="border-t border-border pt-5">
              <PageHeader title={t('new.aiTitle')} subtitle={t('new.aiSubtitle')} />
              <FormField
                name="aiBrief"
                label={t('new.aiLabel')}
                type="textarea"
                placeholder={t('new.aiPlaceholder')}
                value={aiBrief}
                onChange={setAiBrief}
                required
              />
            </div>

            <div className="bg-gold-light border border-gold rounded-lg p-3 flex items-start gap-2">
              <Icon name="info" size={14} className="text-gold mt-0.5 shrink-0" />
              <div className="text-xs text-gold">
                <div className="font-bold mb-1">{t('new.aiWillGenerate.title')}</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{t('new.aiWillGenerate.text')}</li>
                  <li>{t('new.aiWillGenerate.layout')}</li>
                  <li>{t('new.aiWillGenerate.mobile')}</li>
                  <li>{t('new.aiWillGenerate.credits')}</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="bg-danger-light border border-danger rounded-lg p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 text-center bg-secondary text-secondary-foreground font-body font-bold py-3 rounded-xl text-sm"
              >
                {t('new.cancel')}
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex-1 text-center bg-primary text-primary-foreground font-body font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t('new.submitting') : t('new.submit')}
              </button>
            </div>
          </div>
        </div>

        {/* Right — Preview */}
        <div className="flex flex-col gap-5">
          <PageHeader title={t('new.previewTitle')} subtitle={t('new.previewSubtitle')} />
          <InvitationPreview
            emoji={EMOJI[type]}
            title={title || t('new.previewTitleFallback')}
            body={aiBrief.trim().length >= 10 ? aiBrief : t('new.previewBodyFallback')}
            date={formatHumanDate(date, localeTag)}
            time={formatHumanTime(time, locale, localeTag)}
            location={(place.split(',')[0] ?? place).trim() || t('new.previewLocationFallback')}
            family=""
          />

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs font-body text-muted-foreground mb-2">
              {t('new.draftState')}
            </div>
            <div className="font-body font-bold text-sm text-foreground mb-3">
              {t('new.nextStepsTitle')}
            </div>
            <ul className="flex flex-col gap-2 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>{t('new.nextSteps.details')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">→</span>
                <span>{t('new.nextSteps.editor')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">→</span>
                <span>{t('new.nextSteps.guests')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">→</span>
                <span>{t('new.nextSteps.send')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
