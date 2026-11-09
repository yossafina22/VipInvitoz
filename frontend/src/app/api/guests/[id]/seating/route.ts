// VIP-13 — Assign a guest to a seating table (or clear).
//
// PATCH /api/guests/[id]/seating — body: { tableId: string | null }
// Organizer-only. 404 when either the guest or the target table doesn't
// belong to a ceremony the caller owns.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { assignGuestToTable } from '@/lib/server/vipinvitoz/seating';

const Body = z.object({
  tableId: z.string().min(1).nullable(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const { id } = await ctx.params;

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

    // Ownership: guest must belong to a ceremony the caller owns.
    const guest = await prisma.guest.findFirst({
      where: { id, ceremony: { userId } },
      select: { id: true, ceremonyId: true },
    });
    if (!guest) {
      return NextResponse.json(
        { error: 'GUEST_NOT_FOUND', message: 'Invité introuvable.' },
        { status: 404 },
      );
    }

    // If assigning (not clearing), check the target table belongs to the same
    // ceremony as the guest. Prevents moving a guest across ceremonies.
    if (parsed.data.tableId !== null) {
      const table = await prisma.seatingTable.findFirst({
        where: { id: parsed.data.tableId, ceremonyId: guest.ceremonyId },
        select: { id: true },
      });
      if (!table) {
        return NextResponse.json(
          { error: 'TABLE_NOT_FOUND', message: 'Table introuvable.' },
          { status: 404 },
        );
      }
    }

    const updated = await assignGuestToTable(prisma, guest.id, parsed.data.tableId);
    log.info('guest seating updated', {
      guestId: guest.id,
      tableId: parsed.data.tableId,
    });

    return NextResponse.json({
      guest: {
        id: updated.id,
        seatingTableId: updated.seatingTableId,
      },
    });
  });
}
