'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/PageHeader';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api';
import { CategoryRow } from './CategoryRow';
import { ExpenseDialog, type ExpensePayload } from './ExpenseDialog';
import { LOCALE_TAG, type BudgetExpenseDto, type BudgetResponse } from './budget-types';

type Status = 'loading' | 'ready' | 'vip-required' | 'error';
type DialogState = { mode: 'create' } | { mode: 'edit'; expense: BudgetExpenseDto } | null;

const STATUS_STYLE: Record<BudgetExpenseDto['status'], string> = {
  PAID: 'bg-success-light text-success',
  PENDING: 'bg-warning-light text-warning',
  PLANNED: 'bg-secondary text-primary',
};

export default function BudgetPage() {
  const t = useTranslations('budget');
  const locale = useLocale();

  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<BudgetResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const numberFmt = useMemo(
    () =>
      new Intl.NumberFormat(LOCALE_TAG[locale] ?? 'fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const fmt = useCallback((v: string | number) => numberFmt.format(Number(v)), [numberFmt]);
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? 'fr-FR', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }),
    [locale],
  );

  const load = useCallback(async () => {
    try {
      const res = await api<BudgetResponse>(`/api/budget?locale=${locale}`);
      setData(res);
      setStatus('ready');
    } catch (err) {
      setStatus(err instanceof ApiError && err.code === 'TIER_REQUIRED' ? 'vip-required' : 'error');
    }
  }, [locale]);

  useEffect(() => {
    void load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function errorMessage(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.code === 'VALIDATION_FAILED') return t('errors.invalid');
      if (err.code === 'CATEGORY_NOT_EMPTY') return t('categories.notEmpty');
      if (err.code === 'TIER_REQUIRED') return t('vipRequired.desc');
    }
    return t('errors.generic');
  }

  async function mutate(run: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    try {
      await run();
      await load();
      return true;
    } catch (err) {
      showToast(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveNewCategory(label: string, planned: number) {
    if (!data?.ceremonyId) return false;
    const ok = await mutate(() =>
      api('/api/budget/categories', {
        method: 'POST',
        body: { ceremonyId: data.ceremonyId, label, planned },
      }),
    );
    if (ok) setAddingCategory(false);
    return ok;
  }

  function deleteCategory(id: string, label: string) {
    if (!confirm(t('categories.confirmDelete', { label }))) return;
    void mutate(() => api(`/api/budget/categories/${id}`, { method: 'DELETE' }));
  }

  function deleteExpense(e: BudgetExpenseDto) {
    if (!confirm(t('expenses.confirmDelete', { label: e.label }))) return;
    void mutate(() => api(`/api/budget/expenses/${e.id}`, { method: 'DELETE' }));
  }

  async function saveExpense(payload: ExpensePayload) {
    setDialogError(null);
    try {
      if (dialog?.mode === 'edit') {
        await api(`/api/budget/expenses/${dialog.expense.id}`, { method: 'PATCH', body: payload });
      } else {
        await api('/api/budget/expenses', { method: 'POST', body: payload });
      }
      setDialog(null);
      await load();
    } catch (err) {
      setDialogError(errorMessage(err));
    }
  }

  function openCreate() {
    if (!data || data.categories.length === 0) return showToast(t('expenses.needCategory'));
    setDialogError(null);
    setDialog({ mode: 'create' });
  }

  function exportCsv() {
    if (!data?.ceremonyId) return;
    window.location.href = `/api/budget/export?ceremonyId=${encodeURIComponent(data.ceremonyId)}&locale=${locale}`;
  }

  const categoryLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of data?.categories ?? []) map.set(c.id, c.label);
    return map;
  }, [data]);

  function daysLabel(days: number | null): string {
    if (days === null) return t('summary.noDate');
    if (days < 0) return t('summary.daysPast');
    return t('summary.daysUntil', { days });
  }

  return (
    <AppLayout pageTitle={t('pageTitle')} tier="vip">
      <PageHeader title={t('title')} subtitle={t('subtitle')}>
        {status === 'ready' && data?.ceremonyId && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="bg-secondary text-secondary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Icon name="download" size={14} />
              <span className="hidden sm:inline">{t('export')}</span>
            </button>
            <button
              type="button"
              onClick={openCreate}
              disabled={busy}
              className="bg-primary text-primary-foreground font-body font-medium px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Icon name="plus" size={14} />
              {t('addExpense')}
            </button>
          </div>
        )}
      </PageHeader>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('summary.totalPlanned')}</div>
              <div className="font-headings font-bold text-2xl md:text-3xl text-foreground mb-2 tabular-nums">
                {fmt(data.summary.totalPlanned)}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('summary.upcoming', { amount: fmt(data.summary.upcoming) })}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('summary.spent')}</div>
              <div
                className={`font-headings font-bold text-2xl md:text-3xl mb-2 tabular-nums ${data.summary.over ? 'text-danger' : 'text-foreground'}`}
              >
                {fmt(data.summary.spent)}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${data.summary.over ? 'bg-danger' : 'bg-primary'}`}
                  style={{ width: `${Math.min(100, data.summary.percentSpent)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('summary.percent', { percent: data.summary.percentSpent })}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('summary.remaining')}</div>
              <div
                className={`font-headings font-bold text-2xl md:text-3xl mb-2 tabular-nums ${Number(data.summary.remaining) < 0 ? 'text-danger' : 'text-success'}`}
              >
                {fmt(data.summary.remaining)}
              </div>
              <div className="text-xs text-muted-foreground">{daysLabel(data.daysUntil)}</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headings font-bold text-base text-foreground">
                {t('categories.title')}
              </h3>
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                disabled={busy || addingCategory}
                className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md flex items-center gap-1 font-bold disabled:opacity-50"
              >
                <Icon name="plus" size={12} />
                {t('categories.add')}
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {data.categories.length === 0 && !addingCategory && (
                <p className="text-sm text-muted-foreground">{t('categories.empty')}</p>
              )}
              {data.categories.map((c) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  fmt={fmt}
                  busy={busy}
                  onSave={(label, planned) =>
                    mutate(() =>
                      api(`/api/budget/categories/${c.id}`, {
                        method: 'PATCH',
                        body: { label, planned },
                      }),
                    )
                  }
                  onDelete={() => deleteCategory(c.id, c.label)}
                />
              ))}
              {addingCategory && (
                <CategoryRow
                  category={null}
                  fmt={fmt}
                  busy={busy}
                  onSave={saveNewCategory}
                  onCancelNew={() => setAddingCategory(false)}
                />
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-headings font-bold text-base text-foreground">
                {t('expenses.title')}
              </h3>
            </div>
            {data.expenses.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">{t('expenses.empty')}</p>
            ) : (
              <div className="divide-y divide-border">
                {data.expenses.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-bold text-sm text-foreground truncate">
                        {e.label}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {categoryLabel.get(e.categoryId) ?? ''} ·{' '}
                        {e.date
                          ? dateFmt.format(new Date(`${e.date}T00:00:00Z`))
                          : t('expenses.noDate')}
                        {Number(e.quantity) !== 1 && ` · ${fmt(e.quantity)} × ${fmt(e.unitAmount)}`}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-body font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${STATUS_STYLE[e.status]}`}
                    >
                      {t(`status.${e.status}`)}
                    </span>
                    <div className="text-sm font-body font-bold tabular-nums shrink-0 w-24 text-right">
                      {fmt(e.total)}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDialogError(null);
                        setDialog({ mode: 'edit', expense: e });
                      }}
                      disabled={busy}
                      aria-label={t('expenses.edit')}
                      className="text-muted-foreground hover:text-primary disabled:opacity-40"
                    >
                      <Icon name="pencil" size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExpense(e)}
                      disabled={busy}
                      aria-label={t('expenses.delete')}
                      className="text-muted-foreground hover:text-danger disabled:opacity-40"
                    >
                      <Icon name="trash-2" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {dialog && data && (
        <ExpenseDialog
          initial={dialog.mode === 'edit' ? dialog.expense : null}
          categories={data.categories}
          fmt={fmt}
          error={dialogError}
          onClose={() => setDialog(null)}
          onSave={saveExpense}
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
