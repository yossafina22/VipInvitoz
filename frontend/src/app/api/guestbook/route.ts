// VIP-02 — Guestbook read (organizer dashboard).
//
// GET /api/guestbook?ceremonyId=<cuid>
//   - Authenticated: requireAuth.
//   - If ceremonyId omitted: falls back to the caller's most-recently-updated
//     active ceremony (DRAFT or ACTIVE). Lets the dashboard work before a
//     ceremony-selection UI is built.
//   - If ceremonyId provided: must belong to the caller — 404 otherwise
//     (not 403, to avoid leaking ceremony existence).
//   - Returns { ceremonyId, entries } where entries are pinned-first.
//
// Writes (public from invitation slug) will live under /api/invitations/[slug]
// in a later iteration — not needed for the dashboard-first wiring.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/middleware';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { listGuestbookEntriesForCeremony } from '@/lib/server/vipinvitoz/guestbook';

export async function GET(req: NextRequest) {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const url = new URL(req.url);
    const requestedCeremonyId = url.searchParams.get('ceremonyId');

    let ceremonyId: string | null = null;

    if (requestedCeremonyId) {
      const owned = await prisma.ceremony.findFirst({
        where: { id: requestedCeremonyId, userId },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json(
          { error: 'CEREMONY_NOT_FOUND', message: 'Cérémonie introuvable.' },
          { status: 404 },
        );
      }
      ceremonyId = owned.id;
    } else {
      const defaultCeremony = await prisma.ceremony.findFirst({
        where: { userId, status: { in: ['DRAFT', 'ACTIVE'] } },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      });
      ceremonyId = defaultCeremony?.id ?? null;
    }

    if (!ceremonyId) {
      return NextResponse.json({ ceremonyId: null, entries: [] });
    }

    const entries = await listGuestbookEntriesForCeremony(prisma, ceremonyId);

    return NextResponse.json({
      ceremonyId,
      entries: entries.map((e) => ({
        id: e.id,
        authorName: e.authorName,
        content: e.content,
        createdAt: e.createdAt.toISOString(),
        pinnedAt: e.pinnedAt?.toISOString() ?? null,
      })),
    });
  });
}
