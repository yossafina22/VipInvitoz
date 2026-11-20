// VIP budget read.
//
// GET /api/budget?ceremonyId=<cuid>&locale=fr|en
//   - requireAuth + requireTier('VIP').
//   - ceremonyId omitted → caller's most recent DRAFT/ACTIVE ceremony.
//   - Foreign ceremonyId → 404 (not 403) to avoid leaking existence.
//   - First open seeds 6 default categories in `locale` (once per ceremony).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/middleware';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import {
  computeBudgetSummary,
  resolveOwnedCeremonyId,
  seedBudgetIfNeeded,
  serializeCategory,
  serializeExpense,
  toBudgetLocale,
  type BudgetSummary,
} from '@/lib/server/vipinvitoz/budget';

const DAY_MS = 24 * 60 * 60 * 1000;

function withoutByCategory(s: BudgetSummary): Omit<BudgetSummary, 'byCategory'> {
  return {
    totalPlanned: s.totalPlanned,
    spent: s.spent,
    upcoming: s.upcoming,
    remaining: s.remaining,
    percentSpent: s.percentSpent,
    over: s.over,
  };
}

export async function GET(req: NextRequest) {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const denied = await requireTier(prisma, userId, 'VIP');
    if (denied) return denied;

    const url = new URL(req.url);
    const { ceremonyId, notFound } = await resolveOwnedCeremonyId(
      prisma,
      userId,
      url.searchParams.get('ceremonyId'),
    );
    if (notFound) {
      return NextResponse.json(
        { error: 'CEREMONY_NOT_FOUND', message: 'Cérémonie introuvable.' },
        { status: 404 },
      );
    }
    if (!ceremonyId) {
      const summary = withoutByCategory(computeBudgetSummary([], []));
      return NextResponse.json({
        ceremonyId: null,
        daysUntil: null,
        categories: [],
        expenses: [],
        summary,
      });
    }

    await seedBudgetIfNeeded(prisma, ceremonyId, toBudgetLocale(url.searchParams.get('locale')));

    const [categories, expenses, firstOccasion] = await Promise.all([
      prisma.budgetCategory.findMany({
        where: { ceremonyId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.budgetExpense.findMany({
        where: { ceremonyId },
        orderBy: [{ date: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      }),
      prisma.ceremonyOccasion.findFirst({
        where: { ceremonyId },
        orderBy: { startsAt: 'asc' },
        select: { startsAt: true },
      }),
    ]);

    const full = computeBudgetSummary(categories, expenses);
    const { byCategory } = full;
    const summary = withoutByCategory(full);
    const daysUntil = firstOccasion
      ? Math.ceil((firstOccasion.startsAt.getTime() - Date.now()) / DAY_MS)
      : null;

    return NextResponse.json({
      ceremonyId,
      daysUntil,
      categories: categories.map((c) => ({
        ...serializeCategory(c),
        spent: byCategory[c.id]?.spent ?? '0.00',
        upcoming: byCategory[c.id]?.upcoming ?? '0.00',
        over: byCategory[c.id]?.over ?? false,
      })),
      expenses: expenses.map(serializeExpense),
      summary,
    });
  });
}
