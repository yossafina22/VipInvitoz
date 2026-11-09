'use client';

import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { AlertBanner } from '@/components/AlertBanner';
import { RSVPStatusBar } from '@/components/RSVPStatusBar';
import { GuestRow, GUEST_GRID_COLS } from '@/components/GuestRow';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

const MOCK_GUESTS = [
  {
    name: 'Amadou Diallo',
    phone: '+221 77 123 45 67',
    email: 'amadou@mail.com',
    status: 'confirmed' as const,
    companions: 2,
    table: 'Table 3',
    index: 0,
  },
  {
    name: 'Awa Camara',
    phone: '+221 78 234 56 78',
    email: 'awa@mail.com',
    status: 'confirmed' as const,
    companions: 1,
    table: 'Table 3',
    index: 1,
  },
  {
    name: 'Mamadou Sy',
    phone: '+221 76 345 67 89',
    email: 'mamadou@mail.com',
    status: 'declined' as const,
    companions: 0,
    table: '—',
    index: 2,
  },
  {
    name: 'Fatoumata Ba',
    phone: '+221 79 456 78 90',
    email: 'fatoumata@mail.com',
    status: 'pending' as const,
    companions: 0,
    table: '—',
    index: 3,
  },
  {
    name: 'Kofi Mensah',
    phone: '+233 24 567 89 01',
    email: 'kofi@mail.com',
    status: 'confirmed' as const,
    companions: 3,
    table: 'Table 1',
    index: 4,
  },
];

export default function GuestsPage() {
  return (
    <AppLayout pageTitle="Invités & RSVP" tier="premium">
      <PreviewBanner />

      <AlertBanner
        type="upgrade"
        message="Vous avez 187 invités. Votre plan Freemium accepte 20 max. Passez en Premium pour continuer."
        cta="Upgrader"
        href="/#pricing"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Total invités</div>
          <div className="font-headings font-bold text-3xl text-foreground mb-3">200</div>
          <RSVPStatusBar confirmed={87} declined={12} pending={41} total={140} />
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Accompagnants</div>
          <div className="font-headings font-bold text-3xl text-primary mb-3">+34</div>
          <div className="text-xs text-muted-foreground">
            Nombre total avec accompagnants : 121 personnes
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Taux de réponse</div>
          <div className="font-headings font-bold text-3xl text-success mb-3">68%</div>
          <div className="text-xs text-muted-foreground">139 sur 200 ont répondu</div>
        </div>
      </div>

      <PageHeader
        title="Liste des invités"
        subtitle="200 invités au total — envoyez l'invitation, suivez les réponses en direct"
      >
        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <div className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2 w-full sm:w-48">
              <Icon name="search" size={14} />
              <span>Rechercher…</span>
            </div>
          </div>
          <button
            type="button"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="upload" size={14} />
            <span className="hidden sm:inline">Importer CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            type="button"
            className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="plus" size={14} />
            Ajouter
          </button>
        </div>
      </PageHeader>

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
        {MOCK_GUESTS.map((g, i) => (
          <GuestRow key={i} {...g} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div className="bg-secondary border border-border rounded-xl p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-headings font-bold text-lg text-foreground mb-1">Envoyer à tous</h3>
            <p className="text-sm text-muted-foreground">
              Relancer les 41 invités en attente de réponse
            </p>
          </div>
          <button
            type="button"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-body font-bold text-sm shrink-0"
          >
            Envoyer
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-4">Partage direct</h3>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground truncate">
              https://vipin.vz/ceremony/abc123
            </div>
            <button
              type="button"
              className="bg-gold-light text-gold px-3 py-2 rounded-lg font-body font-bold text-sm flex items-center gap-1 shrink-0"
            >
              <Icon name="copy" size={12} /> Copier
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-success text-primary-foreground px-3 py-2.5 rounded-lg font-body font-bold text-sm"
            >
              <Icon name="message-circle" size={14} /> WhatsApp
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground px-3 py-2.5 rounded-lg font-body font-bold text-sm"
            >
              <Icon name="mail" size={14} /> Email
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground px-3 py-2.5 rounded-lg font-body font-bold text-sm"
            >
              <Icon name="link-2" size={14} /> Lien
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
