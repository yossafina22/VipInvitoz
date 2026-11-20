// VIP vendors — list + create.
//
// GET  /api/vendors?ceremonyId=<cuid>&locale=fr|en
//      → { ceremonyId, vendors, categories, total, paidTotal }
//      ceremonyId omitted → most recent DRAFT/ACTIVE ceremony (same as /api/budget).
//      Seeds the default budget categories (like /api/budget) for the picker.
// POST /api/vendors?locale=fr|en — body: { ceremonyId, presetKey?, categoryId?, name,
//      imageUrl?, phone?, amount, paid? }. The amount is mirrored into the budget (see
//      lib/server/vipinvitoz/vendors.ts); without categoryId the preset picks the category.
// auth + VIP (+ CSRF on POST). Foreign ceremony or category → 404.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/server/middleware';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import {
  MoneySchema,
  resolveOwnedCeremonyId,
  seedBudgetIfNeeded,
  toBudgetLocale,
} from '@/lib/server/vipinvitoz/budget';
import { guardBudgetMutation, notFound, parseBody } from '@/lib/server/vipinvitoz/budget-http';
import {
  ImageUrlSchema,
  PhoneSchema,
  PresetKeySchema,
  categoryInCeremony,
  createVendor,
  serializeVendor,
} from '@/lib/server/vipinvitoz/vendors';

const Body = z.object({
  ceremonyId: z.string().min(1),
  presetKey: PresetKeySchema.nullable().optional(),
  categoryId: z.string().min(1).max(64).nullable().optional(),
  name: z.string().trim().min(1).max(80),
  imageUrl: ImageUrlSchema.nullable().optional(),
  phone: PhoneSchema.nullable().optional(),
  amount: MoneySchema,
  paid: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const denied = await requireTier(prisma, auth.user.sub, 'VIP');
    if (denied) return denied;

    const url = new URL(req.url);
    const { ceremonyId, notFound: foreign } = await resolveOwnedCeremonyId(
      prisma,
      auth.user.sub,
      url.searchParams.get('ceremonyId'),
    );
    if (foreign) return notFound('CEREMONY_NOT_FOUND');
    if (!ceremonyId) {
      return NextResponse.json({
        ceremonyId: null,
        vendors: [],
        categories: [],
        total: '0.00',
        paidTotal: '0.00',
      });
    }

    await seedBudgetIfNeeded(prisma, ceremonyId, toBudgetLocale(url.searchParams.get('locale')));
    const [vendors, categories] = await Promise.all([
      prisma.vendor.findMany({
        where: { ceremonyId },
        orderBy: { createdAt: 'asc' },
        include: { expense: { select: { categoryId: true } } },
      }),
      prisma.budgetCategory.findMany({
        where: { ceremonyId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, label: true },
      }),
    ]);
    let total = new Prisma.Decimal(0);
    let paidTotal = new Prisma.Decimal(0);
    for (const v of vendors) {
      total = total.add(v.amount);
      if (v.paid) paidTotal = paidTotal.add(v.amount);
    }

    return NextResponse.json({
      ceremonyId,
      vendors: vendors.map(serializeVendor),
      categories,
      total: total.toFixed(2),
      paidTotal: paidTotal.toFixed(2),
    });
  });
}

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
    if (body.categoryId && !(await categoryInCeremony(prisma, body.categoryId, owned.id))) {
      return notFound('CATEGORY_NOT_FOUND');
    }

    const vendor = await createVendor(prisma, {
      ceremonyId: owned.id,
      locale: toBudgetLocale(new URL(req.url).searchParams.get('locale')),
      presetKey: body.presetKey ?? null,
      categoryId: body.categoryId ?? null,
      name: body.name,
      imageUrl: body.imageUrl ?? null,
      phone: body.phone ?? null,
      amount: body.amount,
      paid: body.paid ?? false,
    });

    return NextResponse.json({ vendor: serializeVendor(vendor) }, { status: 201 });
  });
}
