// VIP-12 — Seating table detail endpoint.
//
// PATCH  /api/seating/tables/[id] — rename / resize. Body: { label?, capacity? }
// DELETE /api/seating/tables/[id] — removes table; guests cascade to unassigned.
// Both: verifyCsrf + requireAuth + ownership check via ceremony.userId.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { deleteSeatingTable, updateSeatingTable } from '@/lib/server/vipinvitoz/seating';

const PatchBody = z
  .object({
    label: z.string().trim().min(1).max(80).optional(),
    capacity: z.number().int().min(1).max(50).optional(),
  })
  .refine((v) => v.label !== undefined || v.capacity !== undefined, {
    message: 'At least one field must be provided.',
  });

async function assertOwned(tableId: string, userId: string) {
  return prisma.seatingTable.findFirst({
    where: { id: tableId, ceremony: { userId } },
    select: { id: true },
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { id } = await ctx.params;
    const owned = await assertOwned(id, auth.user.sub);
    if (!owned) {
      return NextResponse.json(
        { error: 'TABLE_NOT_FOUND', message: 'Table introuvable.' },
        { status: 404 },
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Corps JSON invalide.' },
        { status: 400 },
      );
    }

    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Données invalides.',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const patch: { label?: string; capacity?: number } = {};
    if (parsed.data.label !== undefined) patch.label = parsed.data.label;
    if (parsed.data.capacity !== undefined) patch.capacity = parsed.data.capacity;
    const updated = await updateSeatingTable(prisma, owned.id, patch);
    log.info('seating table updated', { tableId: owned.id });

    return NextResponse.json({
      table: {
        id: updated.id,
        label: updated.label,
        capacity: updated.capacity,
        order: updated.order,
      },
    });
  });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { id } = await ctx.params;
    const owned = await assertOwned(id, auth.user.sub);
    if (!owned) {
      return NextResponse.json(
        { error: 'TABLE_NOT_FOUND', message: 'Table introuvable.' },
        { status: 404 },
      );
    }

    await deleteSeatingTable(prisma, owned.id);
    log.info('seating table deleted', { tableId: owned.id });

    return NextResponse.json({ ok: true });
  });
}
