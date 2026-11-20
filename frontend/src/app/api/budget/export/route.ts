// VIP budget — CSV export for Excel (UTF-8 BOM; fr: `;` + decimal comma,
// en: `,` + decimal point — see CSV_FORMAT in budget.ts).
//
// GET /api/budget/export?ceremonyId=<cuid>&locale=fr|en
// auth + VIP. Foreign ceremony → 404. Headers and status words follow locale.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/middleware';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import {
  lineTotal,
  resolveOwnedCeremonyId,
  toBudgetCsv,
  toBudgetLocale,
  type BudgetLocale,
  type ExpenseStatus,
} from '@/lib/server/vipinvitoz/budget';
import { notFound } from '@/lib/server/vipinvitoz/budget-http';

const HEADERS: Record<BudgetLocale, readonly string[]> = {
  fr: ['Date', 'Poste', 'Libellé', 'Quantité', 'Prix unitaire', 'Total', 'Statut'],
  en: ['Date', 'Category', 'Label', 'Quantity', 'Unit amount', 'Total', 'Status'],
};

const STATUS_WORDS: Record<BudgetLocale, Record<ExpenseStatus, string>> = {
  fr: { PAID: 'Payé', PENDING: 'En attente', PLANNED: 'Prévu' },
  en: { PAID: 'Paid', PENDING: 'Pending', PLANNED: 'Planned' },
};

export async function GET(req: NextRequest) {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const denied = await requireTier(prisma, userId, 'VIP');
    if (denied) return denied;

    const url = new URL(req.url);
    const locale = toBudgetLocale(url.searchParams.get('locale'));
    const { ceremonyId } = await resolveOwnedCeremonyId(
      prisma,
      userId,
      url.searchParams.get('ceremonyId'),
    );
    if (!ceremonyId) return notFound('CEREMONY_NOT_FOUND');

    const expenses = await prisma.budgetExpense.findMany({
      where: { ceremonyId },
      orderBy: [{ date: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      include: { category: { select: { label: true } } },
    });

    const csv = toBudgetCsv(
      expenses.map((e) => ({
        date: e.date,
        category: e.category.label,
        label: e.label,
        quantity: e.quantity.toFixed(2),
        unitAmount: e.unitAmount.toFixed(2),
        total: lineTotal(e.quantity, e.unitAmount).toFixed(2),
        status: STATUS_WORDS[locale][e.status as ExpenseStatus] ?? e.status,
      })),
      HEADERS[locale],
      locale,
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="budget.csv"',
        'cache-control': 'no-store',
      },
    });
  });
}
