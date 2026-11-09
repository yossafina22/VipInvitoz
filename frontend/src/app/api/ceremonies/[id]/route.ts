// VIP-16 — Ceremony detail endpoint.
//
// GET   /api/ceremonies/[id] — organizer-only. Returns the ceremony with its
//       occasions and a guest/invitation count. 404 when the ceremony isn't
//       the caller's (enumeration resistance).
// PATCH /api/ceremonies/[id] — partial update of the top-level ceremony
//       fields (type, title, description, status, musicLabel, musicUrl,
//       coverImageUrl). Occasions are managed via a sibling route.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';

const CEREMONY_TYPES = ['MARIAGE', 'BAPTEME', 'ANNIVERSAIRE', 'DEUIL', 'AUTRE'] as const;
const CEREMONY_STATUSES = ['DRAFT', 'ACTIVE', 'PAST', 'ARCHIVED'] as const;

const PatchBody = z
  .object({
    type: z.enum(CEREMONY_TYPES).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(10).max(1000).optional(),
    status: z.enum(CEREMONY_STATUSES).optional(),
    musicLabel: z.string().max(80).nullable().optional(),
    musicUrl: z.string().url().nullable().optional(),
    coverImageUrl: z.string().url().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided.',
  });

async function assertOwned(ceremonyId: string, userId: string) {
  return prisma.ceremony.findFirst({
    where: { id: ceremonyId, userId },
    select: { id: true },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const { id } = await ctx.params;

    const ceremony = await prisma.ceremony.findFirst({
      where: { id, userId },
      include: {
        occasions: { orderBy: { order: 'asc' } },
        _count: { select: { guests: true, invitations: true } },
      },
    });
    if (!ceremony) {
      return NextResponse.json(
        { error: 'CEREMONY_NOT_FOUND', message: 'Cérémonie introuvable.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ceremony });
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
        { error: 'CEREMONY_NOT_FOUND', message: 'Cérémonie introuvable.' },
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

    const updated = await prisma.ceremony.update({
      where: { id: owned.id },
      data,
      include: {
        occasions: { orderBy: { order: 'asc' } },
        _count: { select: { guests: true, invitations: true } },
      },
    });

    log.info('ceremony updated', { ceremonyId: owned.id, fields: Object.keys(data) });

    return NextResponse.json({ ceremony: updated });
  });
}
