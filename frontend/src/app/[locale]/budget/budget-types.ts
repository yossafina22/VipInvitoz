export const EXPENSE_STATUSES = ['PAID', 'PENDING', 'PLANNED'] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export interface BudgetCategoryDto {
  id: string;
  label: string;
  planned: string;
  order: number;
  spent: string;
  upcoming: string;
  over: boolean;
}

export interface BudgetExpenseDto {
  id: string;
  categoryId: string;
  label: string;
  quantity: string;
  unitAmount: string;
  total: string;
  status: ExpenseStatus;
  date: string | null;
  /** Set when the expense mirrors a vendor amount (read-only here). */
  vendorId: string | null;
}

export interface BudgetSummaryDto {
  totalPlanned: string;
  spent: string;
  upcoming: string;
  remaining: string;
  percentSpent: number;
  over: boolean;
}

export interface BudgetResponse {
  ceremonyId: string | null;
  daysUntil: number | null;
  categories: BudgetCategoryDto[];
  expenses: BudgetExpenseDto[];
  summary: BudgetSummaryDto;
}

const PLAIN = /^(\d+)(?:[.,](\d{1,2}))?$/;
// Thousands groups use one separator (`.` or `,`) followed by exactly 3 digits;
// the optional decimal part must use the other separator.
const GROUPED = /^([1-9]\d{0,2})([.,])(\d{3}(?:\2\d{3})*)(?:([.,])(\d{1,2}))?$/;

// Reads "250 000", "250.000", "1,500", "1 500,50", "1.234,56", "1,234.56".
// Whitespace (incl. the no-break spaces FR uses, matched by JS \s) is a
// thousands separator. Ambiguous or malformed input returns NaN rather than
// guessing a value 1000x off.
export function parseAmountInput(raw: string): number {
  const s = raw.replace(/\s/g, '');
  const plain = PLAIN.exec(s);
  if (plain) return Number(`${plain[1]}.${plain[2] ?? '0'}`);
  const grouped = GROUPED.exec(s);
  if (!grouped) return NaN;
  const [, head, groupSep, groups, decimalSep, decimals] = grouped;
  if (decimalSep !== undefined && decimalSep === groupSep) return NaN;
  const intPart = `${head}${(groups ?? '').split(groupSep ?? '').join('')}`;
  return Number(`${intPart}.${decimals ?? '0'}`);
}

export function budgetQuery(locale: string, ceremonyId: string | null): string {
  const base = `?locale=${encodeURIComponent(locale)}`;
  return ceremonyId ? `${base}&ceremonyId=${encodeURIComponent(ceremonyId)}` : base;
}

// The export is a plain browser navigation, which bypasses api()'s token
// refresh. Calling an authenticated JSON endpoint first refreshes an expired
// session and surfaces 403/404 in the page instead of a raw JSON tab.
export async function prepareExportUrl(
  fetchJson: (path: string) => Promise<unknown>,
  locale: string,
  ceremonyId: string,
): Promise<string> {
  const query = budgetQuery(locale, ceremonyId);
  await fetchJson(`/api/budget${query}`);
  return `/api/budget/export${query}`;
}

export const LOCALE_TAG: Record<string, string> = { fr: 'fr-FR', en: 'en-US' };
