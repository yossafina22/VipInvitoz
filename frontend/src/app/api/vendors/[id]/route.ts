// VIP vendors — update / delete.
//
// PATCH  /api/vendors/[id] — any of { name, imageUrl, phone, amount, paid, categoryId };
//        the linked budget expense is updated in the same transaction. categoryId
//        moves that expense and must belong to the vendor's ceremony (else 404).
// DELETE /api/vendors/[id] → { ok: true }; the linked expense cascades.
// CSRF + auth + VIP. Vendor not owned by the caller → 404.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { MoneySchema } from '@/lib/server/vipinvitoz/budget';
import { guardBudgetMutation, notFound, parseBody } from '@/lib/server/vipinvitoz/budget-http';
import {
  ImageUrlSchema,
  PhoneSchema,
  categoryInCeremony,
  findOwnedVendor,
  serializeVendor,
  updateVendor,
} from '@/lib/server/vipinvitoz/vendors';

const Body = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    imageUrl: ImageUrlSchema.nullable().optional(),
    phone: PhoneSchema.nullable().optional(),
    amount: MoneySchema.optional(),
    paid: z.boolean().optional(),
    categoryId: z.string().min(1).max(64).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'EMPTY_PATCH' });

type Ctx = { params: Promise<{ id: string }> };

function vendorNotFound() {
  return NextResponse.json({ error: 'VENDOR_NOT_FOUND' }, { status: 404 });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const guard = await guardBudgetMutation(req);
    if (guard instanceof NextResponse) return guard;
    const { id } = await ctx.params;

    const body = await parseBody(req, Body);
    if (body instanceof NextResponse) return body;

    const owned = await findOwnedVendor(prisma, guard.userId, id);
    if (!owned) return vendorNotFound();
    if (
      body.categoryId !== undefined &&
      !(await categoryInCeremony(prisma, body.categoryId, owned.ceremonyId))
    ) {
      return notFound('CATEGORY_NOT_FOUND');
    }

    const patch: Parameters<typeof updateVendor>[2] = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl;
    if (body.phone !== undefined) patch.phone = body.phone;
    if (body.amount !== undefined) patch.amount = body.amount;
    if (body.paid !== undefined) patch.paid = body.paid;
    if (body.categoryId !== undefined) patch.categoryId = body.categoryId;

    const vendor = await updateVendor(prisma, owned.id, patch);
    return NextResponse.json({ vendor: serializeVendor(vendor) });
  });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const guard = await guardBudgetMutation(req);
    if (guard instanceof NextResponse) return guard;
    const { id } = await ctx.params;

    const owned = await findOwnedVendor(prisma, guard.userId, id);
    if (!owned) return vendorNotFound();

    await prisma.vendor.delete({ where: { id: owned.id } });
    return NextResponse.json({ ok: true });
  });
}
