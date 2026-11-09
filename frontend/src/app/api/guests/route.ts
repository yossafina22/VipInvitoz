// VIP-05 — Guests root endpoint.
//
// GET  /api/guests?ceremonyId=<cuid>  — list guests for a ceremony the caller owns.
//   If ceremonyId is omitted, falls back to the caller's most-recently-updated
//   active ceremony (same pattern as /api/guestbook).
// POST /api/guests                    — create a guest; body includes ceremonyId.
//
// Ownership checks reject with 404 (not 403) to avoid leaking ceremony
// existence, same posture as the rest of the admin/org surface.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import {
  GuestConflictError,
  createGuest,
  listGuestsForCeremony,
} from '@/lib/server/vipinvitoz/guests';

const Body = z.object({
  ceremonyId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

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

function serialize(g: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    id: g.id,
    name: g.name,
    phone: g.phone,
    email: g.email,
    notes: g.notes,
    createdAt: g.createdAt.toISOString(),
  };
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
      return NextResponse.json({ ceremonyId: null, guests: [] });
    }

    const guests = await listGuestsForCeremony(prisma, ceremonyId);
    return NextResponse.json({ ceremonyId, guests: guests.map(serialize) });
  });
}

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

    const ceremonyId = await resolveCeremonyId(userId, parsed.data.ceremonyId);
    if (!ceremonyId) {
      return NextResponse.json(
        { error: 'CEREMONY_NOT_FOUND', message: 'Cérémonie introuvable.' },
        { status: 404 },
      );
    }

    try {
      const guest = await createGuest(prisma, {
        ceremonyId,
        name: parsed.data.name,
        ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.email ? { email: parsed.data.email } : {}),
        ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
      });

      log.info('guest created', { ceremonyId, guestId: guest.id });
      return NextResponse.json({ guest: serialize(guest) }, { status: 201 });
    } catch (err) {
      if (err instanceof GuestConflictError) {
        return NextResponse.json({ error: err.code, message: err.message }, { status: 409 });
      }
      throw err;
    }
  });
}
