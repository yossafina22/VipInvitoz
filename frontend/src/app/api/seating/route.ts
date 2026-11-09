// VIP-10 — Seating plan list endpoint.
//
// GET /api/seating?ceremonyId=<cuid>
//   Organizer-only (requireAuth + ownership check). Returns { ceremonyId,
//   tables: [{id, label, capacity, order, guests: [...]}], unassigned: [...]}
//   When ceremonyId is omitted, falls back to the caller's most recent
//   active ceremony (same pattern as /api/guestbook + /api/guests).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/middleware';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { listSeatingForCeremony } from '@/lib/server/vipinvitoz/seating';

async function resolveCeremonyId(
  userId: string,
  requestedCeremonyId: string | null,
): Promise<string | null> {
  if (requestedCeremonyId) {
    const owned = await prisma.ceremony.findFirst({
      where: { id: requestedCeremonyId, userId },
      select: { id: true },
    });
    return owned?.id ?? null;
  }
  const defaultCeremony = await prisma.ceremony.findFirst({
    where: { userId, status: { in: ['DRAFT', 'ACTIVE'] } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });
  return defaultCeremony?.id ?? null;
}

export async function GET(req: NextRequest) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const url = new URL(req.url);
    const requestedCeremonyId = url.searchParams.get('ceremonyId');

    const ceremonyId = await resolveCeremonyId(userId, requestedCeremonyId);
    if (requestedCeremonyId && !ceremonyId) {
      return NextResponse.json(
        { error: 'CEREMONY_NOT_FOUND', message: 'Cérémonie introuvable.' },
        { status: 404 },
      );
    }
    if (!ceremonyId) {
      return NextResponse.json({ ceremonyId: null, tables: [], unassigned: [] });
    }

    const { tables, unassigned } = await listSeatingForCeremony(prisma, ceremonyId);

    return NextResponse.json({
      ceremonyId,
      tables: tables.map((t) => ({
        id: t.id,
        label: t.label,
        capacity: t.capacity,
        order: t.order,
        guests: t.guests.map((g) => ({ id: g.id, name: g.name })),
      })),
      unassigned: unassigned.map((g) => ({ id: g.id, name: g.name })),
    });
  });
}
