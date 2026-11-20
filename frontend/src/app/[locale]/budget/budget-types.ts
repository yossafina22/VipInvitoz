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

// Accepts "11,99" and "250 000" (JS \s also matches the no-break spaces used as
// FR thousands separators). Returns NaN when not a number.
export function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

export const LOCALE_TAG: Record<string, string> = { fr: 'fr-FR', en: 'en-US' };
