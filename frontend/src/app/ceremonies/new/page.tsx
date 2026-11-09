'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { StepIndicator } from '@/components/StepIndicator';
import { FormField } from '@/components/FormField';
import { InvitationPreview } from '@/components/InvitationPreview';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

const STEPS = ['Détails', 'Description IA', 'Prévisualiser', 'Invités'];

export default function CreateCeremonyPage() {
  const [title, setTitle] = useState('Mariage de Fatoumata & Ibrahima');
  const [date, setDate] = useState('14 juin 2025');
  const [time, setTime] = useState('15h00');
  const [place, setPlace] = useState('Hôtel Terrou-Bi, Dakar');
  const [aiBrief, setAiBrief] = useState(
    'Mariage traditionnel africain avec touches modernes, ambiance chaleureuse et festive, beaucoup de famille, musique live',
  );

  return (
    <AppLayout pageTitle="Créer une cérémonie" tier="premium">
      <PreviewBanner />

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
                className="w-full bg-input border-2 border-dashed border-border rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-40 hover:bg-secondary hover:border-primary transition"
              >
                <Icon name="image-plus" size={32} className="text-muted-foreground mb-2" />
                <div className="text-sm font-body text-foreground mb-1">
                  Cliquez ou glissez une image
                </div>
                <div className="text-xs text-muted-foreground">JPG, PNG — Max 5 MB</div>
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                Cette image sera affichée comme fond de l&apos;invitation.
              </p>
            </div>

            <div className="border-t border-border pt-5">
              <FormField
                name="type"
                label="Type de cérémonie"
                type="select"
                value="MARIAGE"
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
              <div className="flex-1">
                <FormField
                  name="date"
                  label="Date principale"
                  placeholder="14 juin 2025"
                  value={date}
                  onChange={setDate}
                  required
                />
              </div>
              <div className="sm:w-32">
                <FormField
                  name="time"
                  label="Heure"
                  placeholder="15h00"
                  value={time}
                  onChange={setTime}
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
            />

            <div className="bg-secondary border border-border rounded-lg p-3 text-xs text-secondary-foreground flex items-start gap-2">
              <Icon name="info" size={12} className="mt-0.5 shrink-0" />
              <span>
                Vous pouvez ajouter plusieurs lieux/dates de célébration après (civil + religieux +
                réception).
              </span>
            </div>

            <div className="border-t border-border pt-5">
              <PageHeader
                title="Description pour l'IA"
                subtitle="En une phrase, décrivez l'ambiance souhaitée"
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

            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 text-center bg-secondary text-secondary-foreground font-body font-bold py-3 rounded-xl text-sm"
              >
                Annuler
              </Link>
              <button
                type="button"
                className="flex-1 text-center bg-primary text-primary-foreground font-body font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                Générer l&apos;invitation
              </button>
            </div>
          </div>
        </div>

        {/* Right — Preview */}
        <div className="flex flex-col gap-5">
          <PageHeader title="Aperçu de l'invitation" subtitle="Voici ce que vos invités verront" />
          <InvitationPreview
            emoji="💍"
            title={title}
            body="C'est avec une immense joie que nous vous convions à célébrer notre union dans une atmosphère chaleureuse, festive et familiale."
            date={date}
            time={time}
            location={place.split(',')[0] ?? place}
            family="La famille Diallo & Konaté"
          />

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs font-body text-muted-foreground mb-2">État : Brouillon</div>
            <div className="font-body font-bold text-sm text-foreground mb-3">Étapes suivantes</div>
            <ul className="flex flex-col gap-2 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">✓</span>
                <span>Détails complétés</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>Générer l&apos;invitation par IA</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">→</span>
                <span>Modifier et valider</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">→</span>
                <span>Ajouter les invités</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
