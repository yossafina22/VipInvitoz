// VIP-04 — Pin / unpin a guestbook entry.
//
// POST /api/guestbook/[id]/pin — body: { pinned: boolean }
//
// Authenticated organizer only — must own the ceremony the entry belongs to.
// Pinned entries float to the top of the list on both the dashboard and
// invitation views (see listGuestbookEntriesForCeremony order).
//
// 404 on "entry not found OR not owned" — don't leak which one failed.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { setGuestbookEntryPinned } from '@/lib/server/vipinvitoz/guestbook';

const Body = z.object({
  pinned: z.boolean(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
        { error: 'VALIDATION_FAILED', message: 'Payload invalide.', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    // Ownership check: the entry must belong to a ceremony owned by the caller.
    const entry = await prisma.guestbookEntry.findFirst({
      where: { id, ceremony: { userId } },
      select: { id: true },
    });
    if (!entry) {
      return NextResponse.json(
        { error: 'ENTRY_NOT_FOUND', message: 'Message introuvable.' },
        { status: 404 },
      );
    }

    const updated = await setGuestbookEntryPinned(prisma, entry.id, parsed.data.pinned);

    log.info('guestbook entry pin toggled', { entryId: entry.id, pinned: parsed.data.pinned });

    return NextResponse.json({
      entry: {
        id: updated.id,
        pinnedAt: updated.pinnedAt?.toISOString() ?? null,
      },
    });
  });
}
