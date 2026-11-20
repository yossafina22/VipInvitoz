// VIP budget domain: currency-less amounts (Decimal, 2 dp), server-side totals,
// one-time default categories, ownership lookups and CSV export.

import 'server-only';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { BudgetCategory, BudgetExpense, PrismaClient } from '@prisma/client';

export type ExpenseStatus = 'PAID' | 'PENDING' | 'PLANNED';
export const EXPENSE_STATUSES = ['PAID', 'PENDING', 'PLANNED'] as const;

export type BudgetLocale = 'fr' | 'en';

export const DEFAULT_CATEGORY_LABELS: Record<BudgetLocale, readonly string[]> = {
  fr: ['Salle & décor', 'Traiteur', 'Tenues', 'Photo & vidéo', 'DJ & musique', 'Divers'],
  en: ['Venue & decor', 'Catering', 'Outfits', 'Photo & video', 'DJ & music', 'Miscellaneous'],
};

export function toBudgetLocale(value: string | null | undefined): BudgetLocale {
  return value === 'en' ? 'en' : 'fr';
}

// Decimal parses the number's shortest round-trip string, so this is exact
// (a float tolerance check fails for cents above ~131 072).
function hasAtMostTwoDecimals(x: number): boolean {
  return new Prisma.Decimal(x).decimalPlaces() <= 2;
}

export const MoneySchema = z
  .number()
  .finite()
  .min(0)
  .max(999_999_999_999.99)
  .refine(hasAtMostTwoDecimals, { message: 'MAX_TWO_DECIMALS' });

export const QuantitySchema = z
  .number()
  .finite()
  .positive()
  .max(99_999_999.99)
  .refine(hasAtMostTwoDecimals, { message: 'MAX_TWO_DECIMALS' });

export function lineTotal(quantity: Prisma.Decimal, unitAmount: Prisma.Decimal): Prisma.Decimal {
  return quantity.mul(unitAmount);
}

export interface CategoryTotals {
  spent: string;
  upcoming: string;
  over: boolean;
}

export interface BudgetSummary {
  totalPlanned: string;
  spent: string;
  upcoming: string;
  remaining: string;
  percentSpent: number;
  over: boolean;
  byCategory: Record<string, CategoryTotals>;
}

export function computeBudgetSummary(
  categories: Pick<BudgetCategory, 'id' | 'planned'>[],
  expenses: Pick<BudgetExpense, 'categoryId' | 'quantity' | 'unitAmount' | 'status'>[],
): BudgetSummary {
  const zero = new Prisma.Decimal(0);
  const perCat = new Map<string, { spent: Prisma.Decimal; upcoming: Prisma.Decimal }>();
  let spent = zero;
  let upcoming = zero;

  for (const e of expenses) {
    const total = lineTotal(e.quantity, e.unitAmount);
    const bucket = perCat.get(e.categoryId) ?? { spent: zero, upcoming: zero };
    if (e.status === 'PLANNED') {
      upcoming = upcoming.add(total);
      bucket.upcoming = bucket.upcoming.add(total);
    } else {
      spent = spent.add(total);
      bucket.spent = bucket.spent.add(total);
    }
    perCat.set(e.categoryId, bucket);
  }

  let totalPlanned = zero;
  const byCategory: Record<string, CategoryTotals> = {};
  for (const c of categories) {
    totalPlanned = totalPlanned.add(c.planned);
    const bucket = perCat.get(c.id) ?? { spent: zero, upcoming: zero };
    byCategory[c.id] = {
      spent: bucket.spent.toFixed(2),
      upcoming: bucket.upcoming.toFixed(2),
      over: bucket.spent.gt(c.planned),
    };
  }

  const percentSpent = totalPlanned.isZero()
    ? 0
    : spent.div(totalPlanned).mul(100).toDecimalPlaces(0).toNumber();

  return {
    totalPlanned: totalPlanned.toFixed(2),
    spent: spent.toFixed(2),
    upcoming: upcoming.toFixed(2),
    remaining: totalPlanned.sub(spent).toFixed(2),
    percentSpent,
    over: spent.gt(totalPlanned),
    byCategory,
  };
}

export async function resolveOwnedCeremonyId(
  prisma: PrismaClient,
  userId: string,
  requested: string | null,
): Promise<{ ceremonyId: string | null; notFound: boolean }> {
  if (requested) {
    const owned = await prisma.ceremony.findFirst({
      where: { id: requested, userId },
      select: { id: true },
    });
    return owned ? { ceremonyId: owned.id, notFound: false } : { ceremonyId: null, notFound: true };
  }
  const recent = await prisma.ceremony.findFirst({
    where: { userId, status: { in: ['DRAFT', 'ACTIVE'] } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });
  return { ceremonyId: recent?.id ?? null, notFound: false };
}

export async function seedBudgetIfNeeded(
  prisma: PrismaClient,
  ceremonyId: string,
  locale: BudgetLocale,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Claim the seed atomically: only the request that flips budgetSeededAt
    // from null creates the categories, so concurrent first opens can't double-seed.
    const claim = await tx.ceremony.updateMany({
      where: { id: ceremonyId, budgetSeededAt: null },
      data: { budgetSeededAt: new Date() },
    });
    if (claim.count !== 1) return;
    await tx.budgetCategory.createMany({
      data: DEFAULT_CATEGORY_LABELS[locale].map((label, order) => ({
        ceremonyId,
        label,
        order,
        planned: new Prisma.Decimal(0),
      })),
    });
  });
}

export function findOwnedCategory(
  prisma: PrismaClient,
  userId: string,
  categoryId: string,
): Promise<BudgetCategory | null> {
  return prisma.budgetCategory.findFirst({ where: { id: categoryId, ceremony: { userId } } });
}

export function findOwnedExpense(
  prisma: PrismaClient,
  userId: string,
  expenseId: string,
): Promise<BudgetExpense | null> {
  return prisma.budgetExpense.findFirst({ where: { id: expenseId, ceremony: { userId } } });
}

export interface BudgetCsvRow {
  date: Date | null;
  category: string;
  label: string;
  quantity: string;
  unitAmount: string;
  total: string;
  status: string;
}

// Excel needs a BOM to read the file as UTF-8 (accents).
const UTF8_BOM = String.fromCharCode(0xfeff);

// Excel reads CSV with the OS list separator and decimal mark: FR Excel expects
// `;` and `1,50`, EN Excel expects `,` and `1.50`. Otherwise numbers import as text.
const CSV_FORMAT: Record<BudgetLocale, { separator: string; decimal: string }> = {
  fr: { separator: ';', decimal: ',' },
  en: { separator: ',', decimal: '.' },
};

function csvCell(value: string, separator: string): string {
  // Spreadsheet formula injection: a leading = + - @ would be executed by Excel.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  const needsQuotes = safe.includes(separator) || /["\r\n]/.test(safe);
  return needsQuotes ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toBudgetCsv(
  rows: BudgetCsvRow[],
  headers: readonly string[],
  locale: BudgetLocale,
): string {
  const { separator, decimal } = CSV_FORMAT[locale];
  const num = (v: string) => (decimal === '.' ? v : v.replace('.', decimal));
  const line = (cells: string[]) => cells.map((c) => csvCell(c, separator)).join(separator);
  const lines = [line([...headers])];
  for (const r of rows) {
    lines.push(
      line([
        r.date ? r.date.toISOString().slice(0, 10) : '',
        r.category,
        r.label,
        num(r.quantity),
        num(r.unitAmount),
        num(r.total),
        r.status,
      ]),
    );
  }
  return `${UTF8_BOM}${lines.join('\r\n')}`;
}

export function serializeExpense(
  e: Pick<
    BudgetExpense,
    'id' | 'categoryId' | 'label' | 'quantity' | 'unitAmount' | 'status' | 'date' | 'vendorId'
  >,
) {
  return {
    id: e.id,
    categoryId: e.categoryId,
    label: e.label,
    quantity: e.quantity.toFixed(2),
    unitAmount: e.unitAmount.toFixed(2),
    total: lineTotal(e.quantity, e.unitAmount).toFixed(2),
    status: e.status,
    date: e.date ? e.date.toISOString().slice(0, 10) : null,
    vendorId: e.vendorId ?? null,
  };
}

export function serializeCategory(c: Pick<BudgetCategory, 'id' | 'label' | 'planned' | 'order'>) {
  return { id: c.id, label: c.label, planned: c.planned.toFixed(2), order: c.order };
}

export const ExpenseStatusSchema = z.enum(EXPENSE_STATUSES);

// Calendar date only ('YYYY-MM-DD'), stored at UTC midnight.
export const ExpenseDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), { message: 'INVALID_DATE' })
  .transform((s) => new Date(`${s}T00:00:00Z`));
