'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/Icon';
import { parseAmountInput, type BudgetCategoryDto } from './budget-types';

interface CategoryRowProps {
  category: BudgetCategoryDto | null;
  fmt: (value: string | number) => string;
  busy: boolean;
  onSave: (label: string, planned: number) => Promise<boolean>;
  onDelete?: () => void;
  onCancelNew?: () => void;
}

const INPUT =
  'bg-input border border-border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary';

export function CategoryRow({
  category,
  fmt,
  busy,
  onSave,
  onDelete,
  onCancelNew,
}: CategoryRowProps) {
  const t = useTranslations('budget.categories');
  const tDialog = useTranslations('budget.dialog');
  const isNew = category === null;
  const [editing, setEditing] = useState(isNew);
  const [label, setLabel] = useState(category?.label ?? '');
  const [planned, setPlanned] = useState(category ? category.planned.replace(/\.00$/, '') : '');

  const plannedNum = planned.trim() === '' ? 0 : parseAmountInput(planned);
  const valid =
    label.trim().length > 0 &&
    label.trim().length <= 60 &&
    Number.isFinite(plannedNum) &&
    plannedNum >= 0;

  async function save() {
    if (!valid || busy) return;
    const ok = await onSave(label.trim(), plannedNum);
    if (ok && !isNew) setEditing(false);
  }

  function cancel() {
    if (!category) return onCancelNew?.();
    setLabel(category.label);
    setPlanned(category.planned.replace(/\.00$/, ''));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end p-3 rounded-lg border border-primary/40 bg-secondary/40">
        <label className="flex-1 flex flex-col gap-1 text-xs text-muted-foreground">
          {t('newLabelPrompt')}
          <input
            autoFocus
            value={label}
            maxLength={60}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
            className={INPUT}
          />
        </label>
        <label className="sm:w-40 flex flex-col gap-1 text-xs text-muted-foreground">
          {t('plannedLabel')}
          <input
            inputMode="decimal"
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
            className={`${INPUT} tabular-nums`}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
            aria-label={tDialog('cancel')}
          >
            <Icon name="x" size={14} />
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!valid || busy}
            className="p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            aria-label={tDialog('save')}
          >
            <Icon name="check" size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (!category) return null;
  const spent = Number(category.spent);
  const plannedValue = Number(category.planned);
  const pct =
    plannedValue > 0
      ? Math.min(100, Math.round((spent / plannedValue) * 100))
      : spent > 0
        ? 100
        : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm font-body font-bold text-foreground flex-1 min-w-0 truncate">
          {category.label}
        </span>
        <span
          className={`text-xs font-body font-bold tabular-nums ${category.over ? 'text-danger' : 'text-muted-foreground'}`}
        >
          {t('spentOfPlanned', { spent: fmt(category.spent), planned: fmt(category.planned) })}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={busy}
          aria-label={t('rename')}
          title={t('rename')}
          className="text-muted-foreground hover:text-primary disabled:opacity-40"
        >
          <Icon name="pencil" size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          aria-label={t('delete')}
          title={t('delete')}
          className="text-muted-foreground hover:text-danger disabled:opacity-40"
        >
          <Icon name="trash-2" size={12} />
        </button>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${category.over ? 'bg-danger' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
