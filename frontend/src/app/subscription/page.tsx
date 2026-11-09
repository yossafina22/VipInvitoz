'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { AlertBanner } from '@/components/AlertBanner';
import { PricingCard } from '@/components/PricingCard';
import { PaymentMethodCard } from '@/components/PaymentMethodCard';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

const PREMIUM_FEATURES = [
  { label: 'Invités illimités', included: true },
  { label: '12 modifications IA + chatbot', included: true },
  { label: 'Multi-cérémonie', included: true },
  { label: 'Plan de table drag & drop', included: true },
  { label: 'Projection live photos', included: true },
  { label: "Livre d'or enrichi", included: true },
  { label: 'Suivi budget', included: false },
  { label: 'Coordination prestataires', included: false },
];

const VIP_FEATURES = [
  { label: 'Tout Premium inclus', included: true },
  { label: 'Modifications IA illimitées', included: true },
  { label: 'Suivi budget temps réel', included: true },
  { label: 'Coordination prestataires', included: true },
  { label: 'Orientation invités + navigation', included: true },
  { label: 'Priorité support', included: true },
];

type PayMethod = 'WAVE' | 'ORANGE' | 'CARD';

export default function SubscriptionPage() {
  const [method, setMethod] = useState<PayMethod>('WAVE');

  return (
    <AppLayout pageTitle="Abonnement" tier="premium">
      <PreviewBanner />

      <AlertBanner
        type="info"
        message="Vous êtes actuellement sur le plan Premium. Votre abonnement se renouvelle le 14 mars 2025."
      />

      <div className="mt-6">
        <PageHeader title="Votre abonnement actuel" subtitle="Premium (payé trimestriellement)" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-secondary border border-border rounded-xl p-4">
          <div className="text-xs text-secondary-foreground font-bold mb-1">Plan actif</div>
          <div className="font-headings font-bold text-lg text-foreground">Premium</div>
          <div className="text-xs text-muted-foreground mt-1">Depuis 14 déc. 2024</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground font-bold mb-1">Coût mensuel</div>
          <div className="font-headings font-bold text-lg text-foreground">~2 667 FCFA</div>
          <div className="text-xs text-muted-foreground mt-1">8 000 FCFA / trim.</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground font-bold mb-1">Renouvellement</div>
          <div className="font-headings font-bold text-lg text-foreground">14 mars 2025</div>
          <div className="text-xs text-success mt-1">Dans 58 jours</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground font-bold mb-1">Crédits IA</div>
          <div className="font-headings font-bold text-lg text-foreground">8 / 12</div>
          <div className="text-xs text-muted-foreground mt-1">Restants ce trim.</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 md:p-6 mb-8">
        <h3 className="font-headings font-bold text-lg text-foreground mb-4">Ce que vous avez</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PREMIUM_FEATURES.filter((f) => f.included).map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 bg-secondary rounded-lg text-sm text-secondary-foreground"
            >
              <Icon name="check-circle" size={16} className="text-primary mt-0.5 shrink-0" />
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <PageHeader
        title="Voulez-vous upgrader ?"
        subtitle="Débloquez les outils VIP pour vos cérémonies."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-8">
        <PricingCard
          name="Premium"
          priceAfrica="8 000 FCFA"
          priceEurope="11,99 €"
          features={PREMIUM_FEATURES}
          tier="premium"
        />
        <PricingCard
          name="VIP"
          priceAfrica="15 000 FCFA"
          priceEurope="21,99 €"
          features={VIP_FEATURES}
          tier="vip"
          highlight
        />
      </div>

      <PageHeader title="Moyen de paiement" subtitle="Comment voulez-vous payer ?" />

      <div className="flex flex-col gap-3 mb-8 max-w-2xl">
        <PaymentMethodCard
          name="Wave"
          icon="smartphone"
          region="Sénégal & zone UEMOA"
          selected={method === 'WAVE'}
          onClick={() => setMethod('WAVE')}
        />
        <PaymentMethodCard
          name="Orange Money"
          icon="smartphone"
          region="Sénégal & zone UEMOA"
          selected={method === 'ORANGE'}
          onClick={() => setMethod('ORANGE')}
        />
        <PaymentMethodCard
          name="Carte bancaire"
          icon="credit-card"
          region="Europe & monde"
          selected={method === 'CARD'}
          onClick={() => setMethod('CARD')}
        />
      </div>

      <PageHeader title="Gérer votre abonnement" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-2">Passer en VIP</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Débloquez le suivi budget et la coordination prestataires.
          </p>
          <button
            type="button"
            className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm"
          >
            Upgrader
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-2">Factures</h3>
          <p className="text-sm text-muted-foreground mb-4">Téléchargez vos factures et reçus.</p>
          <button
            type="button"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
          >
            <Icon name="download" size={12} /> Voir les factures
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-2">Historique</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Vos renouvellements trimestriels passés.
          </p>
          <button
            type="button"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm"
          >
            Consulter
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-2">Résilier</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pas de reconduction automatique — votre Premium s&apos;arrête à la date
            d&apos;expiration si vous ne renouvelez pas.
          </p>
          <button
            type="button"
            className="bg-danger-light text-danger font-body font-medium px-4 py-2 rounded-lg text-sm"
          >
            Ne pas renouveler
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
