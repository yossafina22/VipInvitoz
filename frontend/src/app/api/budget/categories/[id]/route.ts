// VIP budget — update / delete a category.
//
// PATCH  /api/budget/categories/[id] — body: { label?, planned?, order? }
// DELETE /api/budget/categories/[id] → { ok: true }; 409 CATEGORY_NOT_EMPTY if it still has
//        expenses (nothing is deleted silently).
// CSRF + auth + VIP. Category not owned by the caller → 404.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { MoneySchema, findOwnedCategory, serializeCategory } from '@/lib/server/vipinvitoz/budget';
import { guardBudgetMutation, notFound, parseBody } from '@/lib/server/vipinvitoz/budget-http';

const Body = z
  .object({
    label: z.string().trim().min(1).max(60).optional(),
    planned: MoneySchema.optional(),
    order: z.number().int().min(0).max(10_000).optional(),
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

    const owned = await findOwnedCategory(prisma, guard.userId, id);
    if (!owned) return notFound('CATEGORY_NOT_FOUND');

    const category = await prisma.budgetCategory.update({
      where: { id: owned.id },
      data: {
        ...(body.label !== undefined ? { label: body.label } : {}),
        ...(body.planned !== undefined ? { planned: new Prisma.Decimal(body.planned) } : {}),
        ...(body.order !== undefined ? { order: body.order } : {}),
      },
    });

    return NextResponse.json({ category: serializeCategory(category) });
  });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const guard = await guardBudgetMutation(req);
    if (guard instanceof NextResponse) return guard;
    const { id } = await ctx.params;

    const owned = await findOwnedCategory(prisma, guard.userId, id);
    if (!owned) return notFound('CATEGORY_NOT_FOUND');

    const expenses = await prisma.budgetExpense.count({ where: { categoryId: owned.id } });
    if (expenses > 0) {
      return NextResponse.json({ error: 'CATEGORY_NOT_EMPTY', expenses }, { status: 409 });
    }

    await prisma.budgetCategory.delete({ where: { id: owned.id } });
    return NextResponse.json({ ok: true });
  });
}
