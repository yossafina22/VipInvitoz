'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { UserAvatar } from '@/components/UserAvatar';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';

type Tab = 'profile' | 'language' | 'notifications' | 'privacy' | 'danger';

const TABS: { id: Tab; icon: string }[] = [
  { id: 'profile', icon: 'user' },
  { id: 'language', icon: 'globe' },
  { id: 'notifications', icon: 'bell' },
  { id: 'privacy', icon: 'lock' },
  { id: 'danger', icon: 'alert-triangle' },
];

const NOTIFS = [
  { key: 'rsvp', enabled: true },
  { key: 'reminders', enabled: true },
  { key: 'newsletter', enabled: false },
  { key: 'offers', enabled: false },
] as const;

export default function AccountPage() {
  const t = useTranslations('account');
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <AppLayout pageTitle={t('pageTitle')} tier="premium">
      <PreviewBanner />

      <PageHeader title={t('title')} subtitle={t('subtitle')} />

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
              {t(`tabs.${item.id}`)}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3 flex flex-col gap-5 md:gap-6">
          {tab === 'profile' && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6">
              <h3 className="font-headings font-bold text-lg text-foreground mb-5">
                {t('profile.title')}
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
                    {t('profile.changePhoto')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 mb-6">
                <FormField name="first" label={t('profile.firstName')} value="Aïssatou" />
                <FormField name="last" label={t('profile.lastName')} value="Diallo" />
                <FormField
                  name="email"
                  type="email"
                  label={t('profile.email')}
                  value="aissatou@mail.com"
                />
                <FormField
                  name="phone"
                  type="tel"
                  label={t('profile.phone')}
                  value="+221 77 123 45 67"
                />
                <FormField name="city" label={t('profile.city')} value="Dakar" />
                <FormField name="country" label={t('profile.country')} value="Sénégal" />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm"
                >
                  {t('profile.cancel')}
                </button>
                <button
                  type="button"
                  className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm"
                >
                  {t('profile.save')}
                </button>
              </div>
            </div>
          )}

          {tab === 'language' && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6">
              <h3 className="font-headings font-bold text-lg text-foreground mb-4">
                {t('language.title')}
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
                {t('notifications.title')}
              </h3>
              <div className="flex flex-col gap-4">
                {NOTIFS.map((n) => (
                  <label
                    key={n.key}
                    className="flex items-start justify-between gap-4 p-3 bg-input rounded-lg cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-body font-medium text-foreground">
                        {t(`notifications.items.${n.key}.label`)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t(`notifications.items.${n.key}.desc`)}
                      </div>
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
                {t('privacy.title')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('privacy.comingSoon')}</p>
            </div>
          )}

          {tab === 'danger' && (
            <div className="bg-danger-light border border-danger rounded-xl p-5 md:p-6">
              <h3 className="font-headings font-bold text-lg text-danger mb-4">
                {t('danger.title')}
              </h3>
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-background rounded-lg border border-danger">
                  <div className="text-sm font-body font-bold text-foreground mb-1">
                    {t('danger.passwordTitle')}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {t('danger.passwordDesc')}
                  </div>
                  <button type="button" className="text-xs font-body font-bold text-danger">
                    {t('danger.passwordCta')}
                  </button>
                </div>
                <div className="p-4 bg-background rounded-lg border border-danger">
                  <div className="text-sm font-body font-bold text-foreground mb-1">
                    {t('danger.deleteTitle')}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{t('danger.deleteDesc')}</div>
                  <button type="button" className="text-xs font-body font-bold text-danger">
                    {t('danger.deleteCta')}
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
