// VIP budget — create an expense.
//
// POST /api/budget/expenses — body: { categoryId, label, quantity?, unitAmount,
//   status, date?: 'YYYY-MM-DD' | null }
// CSRF + auth + VIP. The ceremony is taken from the owned category, never from
// the body. Category not owned by the caller → 404.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import {
  ExpenseDateSchema,
  ExpenseStatusSchema,
  MoneySchema,
  QuantitySchema,
  findOwnedCategory,
  serializeExpense,
} from '@/lib/server/vipinvitoz/budget';
import { guardBudgetMutation, notFound, parseBody } from '@/lib/server/vipinvitoz/budget-http';

const Body = z.object({
  categoryId: z.string().min(1),
  label: z.string().trim().min(1).max(120),
  quantity: QuantitySchema.optional(),
  unitAmount: MoneySchema,
  status: ExpenseStatusSchema,
  date: ExpenseDateSchema.nullable().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const guard = await guardBudgetMutation(req);
    if (guard instanceof NextResponse) return guard;

    const body = await parseBody(req, Body);
    if (body instanceof NextResponse) return body;

    const category = await findOwnedCategory(prisma, guard.userId, body.categoryId);
    if (!category) return notFound('CATEGORY_NOT_FOUND');

    const expense = await prisma.budgetExpense.create({
      data: {
        ceremonyId: category.ceremonyId,
        categoryId: category.id,
        label: body.label,
        quantity: new Prisma.Decimal(body.quantity ?? 1),
        unitAmount: new Prisma.Decimal(body.unitAmount),
        status: body.status,
        date: body.date ?? null,
      },
    });

    return NextResponse.json({ expense: serializeExpense(expense) }, { status: 201 });
  });
}
