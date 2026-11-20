'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';
import { whatsappUrl } from '@/lib/vendors/contact';
import {
  VENDOR_PRESETS,
  VENDOR_PRESET_KEYS,
  isVendorPresetKey,
  type VendorPresetKey,
} from '@/lib/vendors/presets';
import { LOCALE_TAG, budgetQuery } from '../budget/budget-types';
import {
  VendorDialog,
  type CategoryOption,
  type VendorDto,
  type VendorPayload,
} from './VendorDialog';
import { prepareVCardUrl } from './vendor-links';

type Status = 'loading' | 'ready' | 'vip-required' | 'error';
type DialogState =
  | { mode: 'create'; presetKey: VendorPresetKey | null }
  | { mode: 'edit'; vendor: VendorDto }
  | null;

interface VendorsResponse {
  ceremonyId: string | null;
  vendors: VendorDto[];
  categories: CategoryOption[];
  total: string;
  paidTotal: string;
}

interface CeremonyOption {
  id: string;
  title: string;
}

function VendorAvatar({ vendor }: { vendor: VendorDto }) {
  if (vendor.imageUrl) {
    return (
      <img src={vendor.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
    );
  }
  const preset =
    vendor.presetKey && isVendorPresetKey(vendor.presetKey)
      ? VENDOR_PRESETS[vendor.presetKey]
      : null;
  return (
    <div
      className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${preset?.tile ?? 'bg-muted text-muted-foreground'}`}
    >
      <Icon name={preset?.icon ?? 'users'} size={24} />
    </div>
  );
}

export default function VendorsPage() {
  const t = useTranslations('vendors');
  const locale = useLocale();

  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<VendorsResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | null>(null);
  const [ceremonies, setCeremonies] = useState<CeremonyOption[]>([]);

  const numberFmt = useMemo(
    () =>
      new Intl.NumberFormat(LOCALE_TAG[locale] ?? 'fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const fmt = useCallback((v: string | number) => numberFmt.format(Number(v)), [numberFmt]);

  const load = useCallback(async () => {
    try {
      const res = await api<VendorsResponse>(
        `/api/vendors${budgetQuery(locale, selectedCeremonyId)}`,
      );
      setData(res);
      setStatus('ready');
    } catch (err) {
      setStatus(err instanceof ApiError && err.code === 'TIER_REQUIRED' ? 'vip-required' : 'error');
    }
  }, [locale, selectedCeremonyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<{ ceremonies: CeremonyOption[] }>('/api/ceremonies')
      .then((res) => setCeremonies(res.ceremonies.map((c) => ({ id: c.id, title: c.title }))))
      .catch(() => setCeremonies([]));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function errorMessage(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.code === 'VALIDATION_FAILED') return t('errors.invalid');
      if (err.code === 'TIER_REQUIRED') return t('vipRequired.desc');
    }
    return t('errors.generic');
  }

  function presetLabel(key: string | null): string | null {
    return key && isVendorPresetKey(key) ? t(`presets.${key}`) : null;
  }

  async function saveVendor(payload: VendorPayload) {
    if (!dialog || !data?.ceremonyId) return;
    setDialogError(null);
    try {
      if (dialog.mode === 'edit') {
        const { categoryId, ...rest } = payload;
        await api(`/api/vendors/${dialog.vendor.id}`, {
          method: 'PATCH',
          body: categoryId ? { ...rest, categoryId } : rest,
        });
      } else {
        await api(`/api/vendors?locale=${locale}`, {
          method: 'POST',
          body: { ...payload, ceremonyId: data.ceremonyId, presetKey: dialog.presetKey },
        });
      }
      setDialog(null);
      await load();
    } catch (err) {
      setDialogError(errorMessage(err));
    }
  }

  async function openContactCard(vendor: VendorDto) {
    if (!data?.ceremonyId) return;
    try {
      const url = await prepareVCardUrl((path) => api(path), locale, data.ceremonyId, vendor.id);
      window.location.assign(url);
    } catch (err) {
      showToast(errorMessage(err));
    }
  }

  async function togglePaid(vendor: VendorDto) {
    setBusy(true);
    try {
      await api(`/api/vendors/${vendor.id}`, { method: 'PATCH', body: { paid: !vendor.paid } });
      await load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteVendor(vendor: VendorDto) {
    if (!confirm(t('list.confirmDelete', { name: vendor.name }))) return;
    setBusy(true);
    try {
      await api(`/api/vendors/${vendor.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      showToast(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const remaining = data ? Number(data.total) - Number(data.paidTotal) : 0;

  return (
    <AppLayout pageTitle={t('pageTitle')} tier="vip">
      <PageHeader title={t('title')} subtitle={t('subtitle')}>
        {status === 'ready' && data?.ceremonyId && (
          <Link
            href="/budget"
            className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Icon name="wallet" size={14} />
            <span className="hidden sm:inline">{t('seeBudget')}</span>
          </Link>
        )}
      </PageHeader>

      {ceremonies.length > 1 && status !== 'vip-required' && (
        <label className="mb-5 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('ceremonyLabel')}</span>
          <select
            value={selectedCeremonyId ?? data?.ceremonyId ?? ''}
            onChange={(e) => {
              setStatus('loading');
              setSelectedCeremonyId(e.target.value);
            }}
            className="bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary sm:max-w-sm"
          >
            {ceremonies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      )}

      {status === 'loading' && (
        <div className="min-h-[30vh] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-card border border-danger/40 rounded-xl p-6 text-center">
          <p className="text-sm text-danger mb-3">{t('loadError')}</p>
          <button
            type="button"
            onClick={() => {
              setStatus('loading');
              void load();
            }}
            className="text-sm text-primary font-bold hover:underline"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {status === 'vip-required' && (
        <div className="bg-gold-light border border-gold rounded-xl p-8 text-center">
          <Icon name="crown" size={28} className="text-gold mx-auto mb-3" />
          <h3 className="font-headings font-bold text-base text-foreground mb-1">
            {t('vipRequired.title')}
          </h3>
          <p className="text-sm text-muted-foreground mb-5">{t('vipRequired.desc')}</p>
          <Link
            href="/dashboard"
            className="inline-block bg-primary text-primary-foreground font-body font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            {t('vipRequired.cta')}
          </Link>
        </div>
      )}

      {status === 'ready' && data && !data.ceremonyId && (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <h3 className="font-headings font-bold text-base text-foreground mb-1">
            {t('noCeremony.title')}
          </h3>
          <p className="text-sm text-muted-foreground mb-5">{t('noCeremony.desc')}</p>
          <Link
            href="/ceremonies/new"
            className="inline-block bg-primary text-primary-foreground font-body font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            {t('noCeremony.cta')}
          </Link>
        </div>
      )}

      {status === 'ready' && data?.ceremonyId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('summary.total')}</div>
              <div className="font-headings font-bold text-2xl text-foreground tabular-nums">
                {fmt(data.total)}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('summary.paid')}</div>
              <div className="font-headings font-bold text-2xl text-success tabular-nums">
                {fmt(data.paidTotal)}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('summary.remaining')}</div>
              <div className="font-headings font-bold text-2xl text-foreground tabular-nums">
                {fmt(remaining)}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h3 className="font-headings font-bold text-base text-foreground mb-4">
              {t('add.title')}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {VENDOR_PRESET_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setDialogError(null);
                    setDialog({ mode: 'create', presetKey: key });
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:border-primary transition-colors text-center"
                >
                  <span
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${VENDOR_PRESETS[key].tile}`}
                  >
                    <Icon name={VENDOR_PRESETS[key].icon} size={18} />
                  </span>
                  <span className="text-[11px] font-body font-medium text-foreground leading-tight">
                    {t(`presets.${key}`)}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDialogError(null);
                  setDialog({ mode: 'create', presetKey: null });
                }}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-dashed border-border hover:border-primary transition-colors text-center"
              >
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                  <Icon name="plus" size={18} />
                </span>
                <span className="text-[11px] font-body font-medium text-foreground leading-tight">
                  {t('add.custom')}
                </span>
              </button>
            </div>
          </div>

          <h3 className="font-headings font-bold text-base text-foreground mb-3">
            {t('list.title')}
          </h3>
          {data.vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-card border border-dashed border-border rounded-xl p-6 text-center">
              {t('list.empty')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {data.vendors.map((v) => (
                <div
                  key={v.id}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <VendorAvatar vendor={v} />
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-bold text-sm text-foreground truncate">
                        {v.name}
                      </div>
                      {presetLabel(v.presetKey) && (
                        <div className="text-xs text-muted-foreground">
                          {presetLabel(v.presetKey)}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-headings font-bold text-base tabular-nums">
                          {fmt(v.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => void togglePaid(v)}
                          disabled={busy}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md disabled:opacity-50 ${v.paid ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}
                        >
                          {v.paid ? t('list.paid') : t('list.unpaid')}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setDialogError(null);
                          setDialog({ mode: 'edit', vendor: v });
                        }}
                        disabled={busy}
                        aria-label={t('list.edit')}
                        className="text-muted-foreground hover:text-primary disabled:opacity-40"
                      >
                        <Icon name="pencil" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteVendor(v)}
                        disabled={busy}
                        aria-label={t('list.delete')}
                        className="text-muted-foreground hover:text-danger disabled:opacity-40"
                      >
                        <Icon name="trash-2" size={14} />
                      </button>
                    </div>
                  </div>

                  {v.phone ? (
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={whatsappUrl(v.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-success text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-md"
                      >
                        <Icon name="message-circle" size={12} />
                        {t('list.whatsapp')}
                      </a>
                      <a
                        href={`tel:${v.phone}`}
                        className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-md"
                      >
                        <Icon name="phone" size={12} />
                        {t('list.call')}
                      </a>
                      <button
                        type="button"
                        onClick={() => void openContactCard(v)}
                        className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-md"
                      >
                        <Icon name="contact" size={12} />
                        {t('list.saveContact')}
                      </button>
                      <span className="text-xs text-muted-foreground self-center tabular-nums">
                        {v.phone}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('list.noPhone')}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {dialog && (
        <VendorDialog
          initial={dialog.mode === 'edit' ? dialog.vendor : null}
          defaultName={dialog.mode === 'create' ? (presetLabel(dialog.presetKey) ?? '') : ''}
          categories={data?.categories ?? []}
          error={dialogError}
          onClose={() => setDialog(null)}
          onSave={saveVendor}
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
