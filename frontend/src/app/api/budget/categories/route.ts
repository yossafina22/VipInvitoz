// VIP budget — create a user-defined category.
//
// POST /api/budget/categories — body: { ceremonyId, label, planned? }
// CSRF + auth + VIP. Foreign ceremony → 404. New category goes last.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { MoneySchema, serializeCategory } from '@/lib/server/vipinvitoz/budget';
import { guardBudgetMutation, notFound, parseBody } from '@/lib/server/vipinvitoz/budget-http';

const Body = z.object({
  ceremonyId: z.string().min(1),
  label: z.string().trim().min(1).max(60),
  planned: MoneySchema.optional(),
});

export async function POST(req: NextRequest) {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const guard = await guardBudgetMutation(req);
    if (guard instanceof NextResponse) return guard;

    const body = await parseBody(req, Body);
    if (body instanceof NextResponse) return body;

    const owned = await prisma.ceremony.findFirst({
      where: { id: body.ceremonyId, userId: guard.userId },
      select: { id: true },
    });
    if (!owned) return notFound('CEREMONY_NOT_FOUND');

    const last = await prisma.budgetCategory.aggregate({
      where: { ceremonyId: owned.id },
      _max: { order: true },
    });

    const category = await prisma.budgetCategory.create({
      data: {
        ceremonyId: owned.id,
        label: body.label,
        planned: new Prisma.Decimal(body.planned ?? 0),
        order: (last._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ category: serializeCategory(category) }, { status: 201 });
  });
}
