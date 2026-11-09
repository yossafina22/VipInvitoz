// VIP-11 — Create a seating table.
//
// POST /api/seating/tables — body: { ceremonyId, label, capacity? }
// Organizer-only (verifyCsrf + requireAuth + ownership check).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { createSeatingTable } from '@/lib/server/vipinvitoz/seating';

const Body = z.object({
  ceremonyId: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  capacity: z.number().int().min(1).max(50).optional(),
});

export async function POST(req: NextRequest) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

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
          message: 'Données invalides.',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const owned = await prisma.ceremony.findFirst({
      where: { id: parsed.data.ceremonyId, userId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { error: 'CEREMONY_NOT_FOUND', message: 'Cérémonie introuvable.' },
        { status: 404 },
      );
    }

    const table = await createSeatingTable(prisma, {
      ceremonyId: owned.id,
      label: parsed.data.label,
      ...(parsed.data.capacity !== undefined ? { capacity: parsed.data.capacity } : {}),
    });

    log.info('seating table created', { ceremonyId: owned.id, tableId: table.id });

    return NextResponse.json(
      {
        table: {
          id: table.id,
          label: table.label,
          capacity: table.capacity,
          order: table.order,
          guests: [],
        },
      },
      { status: 201 },
    );
  });
}
