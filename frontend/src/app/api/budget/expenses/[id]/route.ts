// VIP budget — update / delete an expense.
//
// PATCH  /api/budget/expenses/[id] — any of { categoryId, label, quantity,
//        unitAmount, status, date }. A new categoryId must be owned AND belong
//        to the expense's own ceremony (no cross-ceremony moves) → else 404.
// DELETE /api/budget/expenses/[id]
// CSRF + auth + VIP. Expense not owned by the caller → 404.

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
  findOwnedExpense,
  serializeExpense,
} from '@/lib/server/vipinvitoz/budget';
import { guardBudgetMutation, notFound, parseBody } from '@/lib/server/vipinvitoz/budget-http';

// A vendor's expense mirrors the vendor amount; edit it from /vendors instead.
function managedByVendor() {
  return NextResponse.json({ error: 'EXPENSE_MANAGED_BY_VENDOR' }, { status: 409 });
}

const Body = z
  .object({
    categoryId: z.string().min(1).optional(),
    label: z.string().trim().min(1).max(120).optional(),
    quantity: QuantitySchema.optional(),
    unitAmount: MoneySchema.optional(),
    status: ExpenseStatusSchema.optional(),
    date: ExpenseDateSchema.nullable().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'EMPTY_PATCH' });

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const guard = await guardBudgetMutation(req);
    if (guard instanceof NextResponse) return guard;
    const { id } = await ctx.params;

    const body = await parseBody(req, Body);
    if (body instanceof NextResponse) return body;

    const owned = await findOwnedExpense(prisma, guard.userId, id);
    if (!owned) return notFound('EXPENSE_NOT_FOUND');
    if (owned.vendorId) return managedByVendor();

    if (body.categoryId !== undefined && body.categoryId !== owned.categoryId) {
      const target = await findOwnedCategory(prisma, guard.userId, body.categoryId);
      if (!target || target.ceremonyId !== owned.ceremonyId) return notFound('CATEGORY_NOT_FOUND');
    }

    const expense = await prisma.budgetExpense.update({
      where: { id: owned.id },
      data: {
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.label !== undefined ? { label: body.label } : {}),
        ...(body.quantity !== undefined ? { quantity: new Prisma.Decimal(body.quantity) } : {}),
        ...(body.unitAmount !== undefined
          ? { unitAmount: new Prisma.Decimal(body.unitAmount) }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.date !== undefined ? { date: body.date } : {}),
      },
    });

    return NextResponse.json({ expense: serializeExpense(expense) });
  });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const guard = await guardBudgetMutation(req);
    if (guard instanceof NextResponse) return guard;
    const { id } = await ctx.params;

    const owned = await findOwnedExpense(prisma, guard.userId, id);
    if (!owned) return notFound('EXPENSE_NOT_FOUND');
    if (owned.vendorId) return managedByVendor();

    await prisma.budgetExpense.delete({ where: { id: owned.id } });
    return NextResponse.json({ ok: true });
  });
}
