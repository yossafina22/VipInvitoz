'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { StepIndicator } from '@/components/StepIndicator';
import { FormField } from '@/components/FormField';
import { InvitationPreview } from '@/components/InvitationPreview';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';

const STEPS = ['Détails', 'Description IA', 'Prévisualiser', 'Invités'];

type CeremonyType = 'MARIAGE' | 'BAPTEME' | 'ANNIVERSAIRE' | 'DEUIL' | 'AUTRE';

const EMOJI: Record<CeremonyType, string> = {
  MARIAGE: '💍',
  BAPTEME: '👶',
  ANNIVERSAIRE: '🎂',
  DEUIL: '🕯️',
  AUTRE: '✨',
};

const TYPE_DEFAULT_LABEL: Record<CeremonyType, string> = {
  MARIAGE: 'Cérémonie',
  BAPTEME: 'Baptême',
  ANNIVERSAIRE: 'Fête',
  DEUIL: 'Cérémonie',
  AUTRE: 'Célébration',
};

function todayIsoDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatHumanDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatHumanTime(hhmm: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':');
  if (!h) return hhmm;
  return `${h}h${m ?? '00'}`;
}

export default function CreateCeremonyPage() {
  const router = useRouter();

  const [type, setType] = useState<CeremonyType>('MARIAGE');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [time, setTime] = useState('15:00');
  const [place, setPlace] = useState('');
  const [aiBrief, setAiBrief] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              label: TYPE_DEFAULT_LABEL[type],
              startsAt,
              locationName,
              locationAddress,
            },
          ],
        },
      });
      router.push(`/ceremonies/${res.ceremony.id}/editor`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CEREMONY_LIMIT_REACHED') {
          setError(
            typeof err.body?.message === 'string'
              ? (err.body.message as string)
              : 'Votre palier actuel ne permet pas de créer une nouvelle cérémonie. Passez en VIP.',
          );
        } else if (err.status === 401) {
          router.push('/login?next=/ceremonies/new');
          return;
        } else {
          setError(
            typeof err.body?.message === 'string'
              ? (err.body.message as string)
              : 'Impossible de créer la cérémonie. Vérifiez vos informations.',
          );
        }
      } else {
        setError('Erreur réseau. Réessayez.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Créer une cérémonie" tier="premium">
      <div className="mb-6">
        <StepIndicator steps={STEPS} currentStep={1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left — Form */}
        <div className="flex flex-col gap-5">
          <PageHeader title="Décrivez votre cérémonie" subtitle="Étape 1 : Informations de base" />

          <div className="bg-card border border-border rounded-xl p-5 md:p-6 flex flex-col gap-5">
            <div>
              <label className="text-sm font-body font-medium text-foreground block mb-2">
                Photo de couverture
              </label>
              <button
                type="button"
                disabled
                className="w-full bg-input border-2 border-dashed border-border rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-40 opacity-60 cursor-not-allowed"
              >
                <Icon name="image-plus" size={32} className="text-muted-foreground mb-2" />
                <div className="text-sm font-body text-foreground mb-1">Bientôt disponible</div>
                <div className="text-xs text-muted-foreground">
                  Vous pourrez l’ajouter après création.
                </div>
              </button>
            </div>

            <div className="border-t border-border pt-5">
              <FormField
                name="type"
                label="Type de cérémonie"
                type="select"
                value={type}
                onChange={(v) => setType(v as CeremonyType)}
                options={[
                  { value: 'MARIAGE', label: 'Mariage' },
                  { value: 'BAPTEME', label: 'Baptême' },
                  { value: 'ANNIVERSAIRE', label: 'Anniversaire' },
                  { value: 'DEUIL', label: 'Deuil' },
                  { value: 'AUTRE', label: 'Autre' },
                ]}
                required
              />
            </div>
            <FormField
              name="title"
              label="Titre de l'événement"
              placeholder="Ex: Mariage de Fatoumata & Ibrahima"
              value={title}
              onChange={setTitle}
              required
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label htmlFor="date" className="text-sm font-body font-medium text-foreground">
                  Date principale<span className="text-primary ml-1">*</span>
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
                  Heure
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
              label="Lieu principal"
              placeholder="Hôtel Terrou-Bi, Dakar"
              value={place}
              onChange={setPlace}
              required
              hint="Vous pourrez ajouter d'autres lieux après (civil, religieux, réception…)."
            />

            <div className="border-t border-border pt-5">
              <PageHeader
                title="Description pour l'IA"
                subtitle="En une phrase, décrivez l'ambiance souhaitée (10 caractères minimum)"
              />
              <FormField
                name="aiBrief"
                label="Inspirez l'IA"
                type="textarea"
                placeholder="Ex: Mariage traditionnel africain avec touches modernes, ambiance chaleureuse et festive..."
                value={aiBrief}
                onChange={setAiBrief}
                required
              />
            </div>

            <div className="bg-gold-light border border-gold rounded-lg p-3 flex items-start gap-2">
              <Icon name="info" size={14} className="text-gold mt-0.5 shrink-0" />
              <div className="text-xs text-gold">
                <div className="font-bold mb-1">L&apos;IA va générer :</div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Texte d&apos;invitation personnalisé</li>
                  <li>Mise en page et couleurs adaptées</li>
                  <li>Structure optimisée mobile</li>
                  <li>Vous pourrez modifier avec vos crédits IA</li>
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
                Annuler
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="flex-1 text-center bg-primary text-primary-foreground font-body font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Création…' : 'Créer la cérémonie'}
              </button>
            </div>
          </div>
        </div>

        {/* Right — Preview */}
        <div className="flex flex-col gap-5">
          <PageHeader title="Aperçu de l'invitation" subtitle="Voici ce que vos invités verront" />
          <InvitationPreview
            emoji={EMOJI[type]}
            title={title || 'Votre événement'}
            body={
              aiBrief.trim().length >= 10
                ? aiBrief
                : 'Décrivez votre ambiance (10+ caractères) — un aperçu stylisé par l’IA apparaîtra sur l’invitation finale.'
            }
            date={formatHumanDate(date)}
            time={formatHumanTime(time)}
            location={(place.split(',')[0] ?? place).trim() || 'Lieu à définir'}
            family=""
          />

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs font-body text-muted-foreground mb-2">État : Brouillon</div>
            <div className="font-body font-bold text-sm text-foreground mb-3">Étapes suivantes</div>
            <ul className="flex flex-col gap-2 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>Compléter les détails</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">→</span>
                <span>Modifier dans l’éditeur</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">→</span>
                <span>Ajouter les invités</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">→</span>
                <span>Envoyer les invitations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
