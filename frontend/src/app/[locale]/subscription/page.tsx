'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { AlertBanner } from '@/components/AlertBanner';
import { PricingCard } from '@/components/PricingCard';
import { PaymentMethodCard } from '@/components/PaymentMethodCard';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

const PREMIUM_FEATURES = [
  { key: 'unlimitedGuests', included: true },
  { key: 'aiEdits12', included: true },
  { key: 'multiCeremony', included: true },
  { key: 'seating', included: true },
  { key: 'projection', included: true },
  { key: 'guestbook', included: true },
  { key: 'budget', included: false },
  { key: 'vendors', included: false },
] as const;

const VIP_FEATURES = [
  { key: 'allPremium', included: true },
  { key: 'aiUnlimited', included: true },
  { key: 'budgetRealtime', included: true },
  { key: 'vendors', included: true },
  { key: 'orientation', included: true },
  { key: 'prioritySupport', included: true },
] as const;

type PayMethod = 'WAVE' | 'ORANGE' | 'CARD';

export default function SubscriptionPage() {
  const t = useTranslations('subscription');
  const [method, setMethod] = useState<PayMethod>('WAVE');

  const premiumFeatures = PREMIUM_FEATURES.map((f) => ({
    label: t(`features.${f.key}`),
    included: f.included,
  }));
  const vipFeatures = VIP_FEATURES.map((f) => ({
    label: t(`features.${f.key}`),
    included: f.included,
  }));

  return (
    <AppLayout pageTitle={t('pageTitle')} tier="premium">
      <PreviewBanner />

      <AlertBanner type="info" message={t('banner')} />

      <div className="mt-6">
        <PageHeader title={t('currentTitle')} subtitle={t('currentSubtitle')} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-secondary border border-border rounded-xl p-4">
          <div className="text-xs text-secondary-foreground font-bold mb-1">
            {t('stats.activePlan')}
          </div>
          <div className="font-headings font-bold text-lg text-foreground">Premium</div>
          <div className="text-xs text-muted-foreground mt-1">{t('stats.since')}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground font-bold mb-1">
            {t('stats.monthlyCost')}
          </div>
          <div className="font-headings font-bold text-lg text-foreground">~2 667 FCFA</div>
          <div className="text-xs text-muted-foreground mt-1">{t('stats.perQuarter')}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground font-bold mb-1">{t('stats.renewal')}</div>
          <div className="font-headings font-bold text-lg text-foreground">
            {t('stats.renewalDate')}
          </div>
          <div className="text-xs text-success mt-1">{t('stats.renewalIn')}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground font-bold mb-1">{t('stats.aiCredits')}</div>
          <div className="font-headings font-bold text-lg text-foreground">8 / 12</div>
          <div className="text-xs text-muted-foreground mt-1">{t('stats.aiCreditsSub')}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 md:p-6 mb-8">
        <h3 className="font-headings font-bold text-lg text-foreground mb-4">{t('included')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {premiumFeatures
            .filter((f) => f.included)
            .map((f, i) => (
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

      <PageHeader title={t('upgradeTitle')} subtitle={t('upgradeSubtitle')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-8">
        <PricingCard
          name="Premium"
          priceAfrica="8 000 FCFA"
          priceEurope="11,99 €"
          features={premiumFeatures}
          tier="premium"
        />
        <PricingCard
          name="VIP"
          priceAfrica="15 000 FCFA"
          priceEurope="21,99 €"
          features={vipFeatures}
          tier="vip"
          highlight
        />
      </div>

      <PageHeader title={t('paymentTitle')} subtitle={t('paymentSubtitle')} />

      <div className="flex flex-col gap-3 mb-8 max-w-2xl">
        <PaymentMethodCard
          name="Wave"
          icon="smartphone"
          region={t('methods.regionUemoa')}
          selected={method === 'WAVE'}
          onClick={() => setMethod('WAVE')}
        />
        <PaymentMethodCard
          name="Orange Money"
          icon="smartphone"
          region={t('methods.regionUemoa')}
          selected={method === 'ORANGE'}
          onClick={() => setMethod('ORANGE')}
        />
        <PaymentMethodCard
          name={t('methods.card')}
          icon="credit-card"
          region={t('methods.regionWorld')}
          selected={method === 'CARD'}
          onClick={() => setMethod('CARD')}
        />
      </div>

      <PageHeader title={t('manageTitle')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-2">
            {t('manage.vipTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{t('manage.vipDesc')}</p>
          <button
            type="button"
            className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm"
          >
            {t('manage.vipCta')}
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-2">
            {t('manage.invoicesTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{t('manage.invoicesDesc')}</p>
          <button
            type="button"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
          >
            <Icon name="download" size={12} /> {t('manage.invoicesCta')}
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-2">
            {t('manage.historyTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{t('manage.historyDesc')}</p>
          <button
            type="button"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm"
          >
            {t('manage.historyCta')}
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 md:p-6">
          <h3 className="font-headings font-bold text-lg text-foreground mb-2">
            {t('manage.cancelTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{t('manage.cancelDesc')}</p>
          <button
            type="button"
            className="bg-danger-light text-danger font-body font-medium px-4 py-2 rounded-lg text-sm"
          >
            {t('manage.cancelCta')}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
