// VIP-16 — Add an occasion to a ceremony.
//
// POST /api/ceremonies/[id]/occasions — organizer-only. Appends a new
// occasion to the end (order = max + 1). Returns the created row.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';

const Body = z.object({
  label: z.string().trim().min(1).max(80),
  startsAt: z.coerce.date(),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60)
    .optional(),
  locationName: z.string().trim().min(1).max(200),
  locationAddress: z.string().trim().min(1).max(500),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  instructions: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { id } = await ctx.params;

    const owned = await prisma.ceremony.findFirst({
      where: { id, userId: auth.user.sub },
      select: { id: true },
    });
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

    const parsed = Body.safeParse(json);
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

    const max = await prisma.ceremonyOccasion.aggregate({
      where: { ceremonyId: owned.id },
      _max: { order: true },
    });
    const nextOrder = (max._max.order ?? -1) + 1;

    const data: {
      ceremonyId: string;
      label: string;
      startsAt: Date;
      locationName: string;
      locationAddress: string;
      order: number;
      durationMinutes?: number;
      locationLat?: number;
      locationLng?: number;
      instructions?: string;
    } = {
      ceremonyId: owned.id,
      label: parsed.data.label,
      startsAt: parsed.data.startsAt,
      locationName: parsed.data.locationName,
      locationAddress: parsed.data.locationAddress,
      order: nextOrder,
    };
    if (parsed.data.durationMinutes !== undefined)
      data.durationMinutes = parsed.data.durationMinutes;
    if (parsed.data.locationLat !== undefined) data.locationLat = parsed.data.locationLat;
    if (parsed.data.locationLng !== undefined) data.locationLng = parsed.data.locationLng;
    if (parsed.data.instructions !== undefined) data.instructions = parsed.data.instructions;

    const occasion = await prisma.ceremonyOccasion.create({ data });
    log.info('occasion created', { ceremonyId: owned.id, occasionId: occasion.id });

    return NextResponse.json({ occasion }, { status: 201 });
  });
}
