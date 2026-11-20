'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { PreviewBanner } from '@/components/PreviewBanner';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';

interface Occasion {
  id: string;
  label: string;
  startsAt: string;
  locationName: string;
  locationAddress: string;
}

interface Ceremony {
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
  occasions: Occasion[];
  _count?: { guests: number; invitations: number };
}

type Status = 'loading' | 'ready' | 'unauth' | 'error';

const CEREMONY_EMOJI: Record<string, string> = {
  MARIAGE: '💍',
  BAPTEME: '🕊️',
  ANNIVERSAIRE: '🎂',
  DEUIL: '🕯️',
  AUTRE: '✨',
};

const LOCALE_TAG: Record<string, string> = { fr: 'fr-FR', en: 'en-US' };

const KNOWN_STATUSES = ['DRAFT', 'ACTIVE', 'PAST', 'ARCHIVED'] as const;
type KnownStatus = (typeof KNOWN_STATUSES)[number];

function isKnownStatus(value: string): value is KnownStatus {
  return (KNOWN_STATUSES as readonly string[]).includes(value);
}

export default function CeremoniesListPage() {
  const t = useTranslations('ceremonies');
  const locale = useLocale();
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? 'fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [locale],
  );
  const [status, setStatus] = useState<Status>('loading');
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await api<{ ceremonies: Ceremony[] }>('/api/ceremonies');
      setCeremonies(res.ceremonies);
      setStatus('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStatus('unauth');
      } else {
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  async function handleQuickCreate() {
    setCreating(true);
    setErrorMsg(null);
    try {
      const now = new Date();
      const inThreeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      await api('/api/ceremonies', {
        method: 'POST',
        body: {
          type: 'MARIAGE',
          title: t('list.demo.title'),
          description: t('list.demo.description'),
          occasions: [
            {
              label: t('list.demo.occasionLabel'),
              startsAt: inThreeMonths.toISOString(),
              locationName: 'Hôtel Terrou-Bi',
              locationAddress: 'Boulevard Martin Luther King, Dakar, Sénégal',
            },
          ],
        },
      });
      await refetch();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: unknown } | undefined;
        setErrorMsg(typeof body?.message === 'string' ? body.message : err.message);
      } else {
        setErrorMsg(t('list.quickCreateError'));
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppLayout pageTitle={t('list.pageTitle')} tier="premium">
      {status === 'unauth' && <PreviewBanner />}

      <PageHeader
        title={t('list.pageTitle')}
        subtitle={
          status === 'loading'
            ? t('list.loading')
            : status === 'unauth'
              ? t('list.subtitleUnauth')
              : t('list.subtitleCount', { count: ceremonies.length })
        }
      >
        <Link
          href="/ceremonies/new"
          className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Icon name="plus" size={14} />
          <span className="hidden sm:inline">{t('list.newCeremony')}</span>
          <span className="sm:hidden">{t('list.newCeremonyShort')}</span>
        </Link>
      </PageHeader>

      {status === 'loading' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-muted rounded mb-3" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : status === 'unauth' ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3 opacity-40">🔒</div>
          <p className="text-sm text-muted-foreground mb-4">{t('list.unauthMessage')}</p>
          <Link
            href="/auth/login"
            className="inline-block bg-primary text-primary-foreground font-body font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            {t('list.login')}
          </Link>
        </div>
      ) : status === 'error' ? (
        <div className="bg-card border border-danger/40 rounded-xl p-6 text-center">
          <p className="text-sm text-danger mb-3">{t('list.loadError')}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('loading');
              void refetch();
            }}
            className="text-sm text-primary font-bold hover:underline"
          >
            {t('list.retry')}
          </button>
        </div>
      ) : ceremonies.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3 opacity-40">💍</div>
          <h3 className="font-headings font-bold text-base text-foreground mb-1">
            {t('list.emptyTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            {t('list.emptyDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/ceremonies/new"
              className="bg-primary text-primary-foreground font-body font-bold px-5 py-2.5 rounded-lg text-sm w-full sm:w-auto"
            >
              {t('list.emptyCta')}
            </Link>
            <button
              type="button"
              onClick={handleQuickCreate}
              disabled={creating}
              className="bg-secondary text-secondary-foreground font-body font-medium px-5 py-2.5 rounded-lg text-sm w-full sm:w-auto disabled:opacity-50"
            >
              {creating ? t('list.quickCreating') : t('list.quickCreate')}
            </button>
          </div>
          {errorMsg && <p className="text-xs text-danger mt-4">{errorMsg}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ceremonies.map((c) => (
            <Link
              key={c.id}
              href={`/ceremonies/${c.id}/editor`}
              className="group bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="text-2xl mb-1">{CEREMONY_EMOJI[c.type] ?? '✨'}</div>
                  <h3 className="font-headings font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                </div>
                <span
                  className={`text-[11px] font-body font-bold px-2 py-1 rounded-md shrink-0 ${
                    c.status === 'ACTIVE'
                      ? 'bg-success-light text-success'
                      : c.status === 'DRAFT'
                        ? 'bg-gold-light text-gold'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isKnownStatus(c.status) ? t(`status.${c.status}`) : c.status}
                </span>
              </div>
              {c.occasions[0] && (
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Icon name="calendar" size={12} />
                  {dateFmt.format(new Date(c.occasions[0].startsAt))}
                </div>
              )}
              {c.occasions[0] && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon name="map-pin" size={12} />
                  <span className="truncate">{c.occasions[0].locationName}</span>
                </div>
              )}
              {c._count && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span>{t('list.guests', { count: c._count.guests })}</span>
                  <span>{t('list.sent', { count: c._count.invitations })}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
