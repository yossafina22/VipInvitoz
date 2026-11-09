'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { UserAvatar } from '@/components/UserAvatar';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

type Tab = 'profile' | 'language' | 'notifications' | 'privacy' | 'danger';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profil', icon: 'user' },
  { id: 'language', label: 'Langue', icon: 'globe' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'privacy', label: 'Confidentialité', icon: 'lock' },
  { id: 'danger', label: 'Zone de danger', icon: 'alert-triangle' },
];

const NOTIFS = [
  { label: 'RSVP reçus', desc: 'Être alerté quand un invité répond', enabled: true },
  {
    label: 'Rappels cérémonies',
    desc: 'Rappels 7 jours, 24h et 1h avant l’événement',
    enabled: true,
  },
  { label: 'Newsletter', desc: 'Conseils et astuces pour mieux organiser', enabled: false },
  { label: 'Offres & promotions', desc: 'Réductions et offres spéciales', enabled: false },
];

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <AppLayout pageTitle="Paramètres" tier="premium">
      <PreviewBanner />

      <PageHeader
        title="Vos paramètres"
        subtitle="Gérez votre profil, vos préférences et vos notifications."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Nav */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-body shrink-0 ${
                item.id === tab
                  ? 'bg-secondary text-secondary-foreground font-bold'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3 flex flex-col gap-5 md:gap-6">
          {tab === 'profile' && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6">
              <h3 className="font-headings font-bold text-lg text-foreground mb-5">
                Profil utilisateur
              </h3>
              <div className="flex items-center gap-5 md:gap-6 mb-6 pb-6 border-b border-border">
                <UserAvatar
                  name="Aïssatou Diallo"
                  index={0}
                  className="w-16 h-16 md:w-20 md:h-20"
                />
                <div>
                  <div className="font-body font-bold text-sm text-foreground mb-1">
                    Aïssatou Diallo
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">Dakar, Sénégal</div>
                  <button type="button" className="text-xs font-body font-bold text-primary">
                    Changer la photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 mb-6">
                <FormField name="first" label="Prénom" value="Aïssatou" />
                <FormField name="last" label="Nom" value="Diallo" />
                <FormField name="email" type="email" label="Email" value="aissatou@mail.com" />
                <FormField name="phone" type="tel" label="Téléphone" value="+221 77 123 45 67" />
                <FormField name="city" label="Ville" value="Dakar" />
                <FormField name="country" label="Pays" value="Sénégal" />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {tab === 'language' && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6">
              <h3 className="font-headings font-bold text-lg text-foreground mb-4">
                Langue de l&apos;interface
              </h3>
              <div className="flex gap-3">
                {[
                  { code: 'FR', label: 'Français', selected: true },
                  { code: 'EN', label: 'English', selected: false },
                  { code: 'DE', label: 'Deutsch', selected: false },
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-body border ${
                      l.selected
                        ? 'border-primary bg-secondary text-primary font-bold'
                        : 'border-border text-foreground hover:border-primary'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6">
              <h3 className="font-headings font-bold text-lg text-foreground mb-4">
                Notifications
              </h3>
              <div className="flex flex-col gap-4">
                {NOTIFS.map((n, i) => (
                  <label
                    key={i}
                    className="flex items-start justify-between gap-4 p-3 bg-input rounded-lg cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-body font-medium text-foreground">{n.label}</div>
                      <div className="text-xs text-muted-foreground">{n.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={n.enabled}
                      className="w-4 h-4 mt-1 shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6">
              <h3 className="font-headings font-bold text-lg text-foreground mb-4">
                Confidentialité
              </h3>
              <p className="text-sm text-muted-foreground">
                Configuration des partages et de la visibilité des données — à venir dans la
                prochaine mise à jour.
              </p>
            </div>
          )}

          {tab === 'danger' && (
            <div className="bg-danger-light border border-danger rounded-xl p-5 md:p-6">
              <h3 className="font-headings font-bold text-lg text-danger mb-4">Zone de danger</h3>
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-background rounded-lg border border-danger">
                  <div className="text-sm font-body font-bold text-foreground mb-1">
                    Changer le mot de passe
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Vous recevrez un lien de réinitialisation par email.
                  </div>
                  <button type="button" className="text-xs font-body font-bold text-danger">
                    Envoyer un lien
                  </button>
                </div>
                <div className="p-4 bg-background rounded-lg border border-danger">
                  <div className="text-sm font-body font-bold text-foreground mb-1">
                    Supprimer votre compte
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Cette action est irréversible. Toutes vos données seront supprimées.
                  </div>
                  <button type="button" className="text-xs font-body font-bold text-danger">
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
