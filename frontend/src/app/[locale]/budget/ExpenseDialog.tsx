'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  EXPENSE_STATUSES,
  parseAmountInput,
  type BudgetCategoryDto,
  type BudgetExpenseDto,
  type ExpenseStatus,
} from './budget-types';

export interface ExpensePayload {
  categoryId: string;
  label: string;
  quantity: number;
  unitAmount: number;
  status: ExpenseStatus;
  date: string | null;
}

interface ExpenseDialogProps {
  initial: BudgetExpenseDto | null;
  categories: BudgetCategoryDto[];
  fmt: (value: string | number) => string;
  error: string | null;
  onClose: () => void;
  onSave: (payload: ExpensePayload) => Promise<void>;
}

const INPUT =
  'w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary';
const LABEL = 'text-xs text-muted-foreground';

function trimZeros(value: string): string {
  return value.replace(/\.00$/, '');
}

export function ExpenseDialog({
  initial,
  categories,
  fmt,
  error,
  onClose,
  onSave,
}: ExpenseDialogProps) {
  const t = useTranslations('budget');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [quantity, setQuantity] = useState(initial ? trimZeros(initial.quantity) : '1');
  const [unitAmount, setUnitAmount] = useState(initial ? trimZeros(initial.unitAmount) : '');
  const [status, setStatus] = useState<ExpenseStatus>(initial?.status ?? 'PLANNED');
  const [date, setDate] = useState(initial?.date ?? '');
  const [saving, setSaving] = useState(false);

  const q = parseAmountInput(quantity);
  const u = parseAmountInput(unitAmount);
  const totalOk = Number.isFinite(q) && Number.isFinite(u);
  const valid = label.trim().length > 0 && categoryId !== '' && totalOk && q > 0 && u >= 0;

  async function handleSave() {
    if (!valid || saving) return;
    setSaving(true);
    await onSave({
      categoryId,
      label: label.trim(),
      quantity: q,
      unitAmount: u,
      status,
      date: date === '' ? null : date,
    });
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-card border border-border rounded-xl p-5 max-w-md w-full flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-headings font-bold text-base text-foreground">
          {initial ? t('dialog.editTitle') : t('dialog.createTitle')}
        </h3>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>{t('dialog.label')}</span>
          <input
            autoFocus
            value={label}
            maxLength={120}
            placeholder={t('dialog.labelPlaceholder')}
            onChange={(e) => setLabel(e.target.value)}
            className={INPUT}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>{t('dialog.category')}</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={INPUT}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-3">
          <label className="w-28 flex flex-col gap-1.5">
            <span className={LABEL}>{t('dialog.quantity')}</span>
            <input
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`${INPUT} tabular-nums`}
            />
          </label>
          <label className="flex-1 flex flex-col gap-1.5">
            <span className={LABEL}>{t('dialog.unitAmount')}</span>
            <input
              inputMode="decimal"
              value={unitAmount}
              onChange={(e) => setUnitAmount(e.target.value)}
              className={`${INPUT} tabular-nums`}
            />
          </label>
        </div>
        <div className="text-sm font-body font-bold text-foreground tabular-nums">
          {t('dialog.total', { amount: totalOk ? fmt(q * u) : '—' })}
        </div>

        <div className="flex gap-3">
          <label className="flex-1 flex flex-col gap-1.5">
            <span className={LABEL}>{t('dialog.status')}</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
              className={INPUT}
            >
              {EXPENSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 flex flex-col gap-1.5">
            <span className={LABEL}>{t('dialog.date')}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT}
            />
          </label>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2 text-sm text-muted-foreground"
          >
            {t('dialog.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!valid || saving}
            className="flex-1 bg-primary text-primary-foreground font-body font-bold py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? t('dialog.saving') : t('dialog.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
