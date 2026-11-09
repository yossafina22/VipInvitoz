// VIP-16 — Update or delete one occasion.
//
// PATCH  /api/ceremonies/[id]/occasions/[occId] — partial update.
// DELETE /api/ceremonies/[id]/occasions/[occId] — refuses the last remaining
//        occasion (every ceremony must keep at least one).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';

const PatchBody = z
  .object({
    label: z.string().trim().min(1).max(80).optional(),
    startsAt: z.coerce.date().optional(),
    durationMinutes: z
      .number()
      .int()
      .positive()
      .max(24 * 60)
      .nullable()
      .optional(),
    locationName: z.string().trim().min(1).max(200).optional(),
    locationAddress: z.string().trim().min(1).max(500).optional(),
    locationLat: z.number().min(-90).max(90).nullable().optional(),
    locationLng: z.number().min(-180).max(180).nullable().optional(),
    instructions: z.string().max(2000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided.',
  });

async function assertOwned(ceremonyId: string, occId: string, userId: string) {
  return prisma.ceremonyOccasion.findFirst({
    where: { id: occId, ceremonyId, ceremony: { userId } },
    select: { id: true, ceremonyId: true },
  });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; occId: string }> },
) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { id, occId } = await ctx.params;
    const owned = await assertOwned(id, occId, auth.user.sub);
    if (!owned) {
      return NextResponse.json(
        { error: 'OCCASION_NOT_FOUND', message: 'Occasion introuvable.' },
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
          message: 'Champs invalides.',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) data[k] = v;
    }

    const updated = await prisma.ceremonyOccasion.update({
      where: { id: owned.id },
      data,
    });
    log.info('occasion updated', { occasionId: owned.id, fields: Object.keys(data) });

    return NextResponse.json({ occasion: updated });
  });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; occId: string }> },
) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { id, occId } = await ctx.params;
    const owned = await assertOwned(id, occId, auth.user.sub);
    if (!owned) {
      return NextResponse.json(
        { error: 'OCCASION_NOT_FOUND', message: 'Occasion introuvable.' },
        { status: 404 },
      );
    }

    // A ceremony must keep at least one occasion — the editor UI needs a
    // base row to attach date / location to.
    const count = await prisma.ceremonyOccasion.count({ where: { ceremonyId: owned.ceremonyId } });
    if (count <= 1) {
      return NextResponse.json(
        {
          error: 'OCCASION_LAST_REMAINING',
          message:
            'Impossible de supprimer la dernière occasion — chaque cérémonie doit en garder une.',
        },
        { status: 400 },
      );
    }

    await prisma.ceremonyOccasion.delete({ where: { id: owned.id } });
    log.info('occasion deleted', { occasionId: owned.id });

    return NextResponse.json({ ok: true });
  });
}
