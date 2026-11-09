// VIP-06 — Guest detail endpoint.
//
// DELETE /api/guests/[id] — remove a guest from a ceremony the caller owns.
// 404 on "not found OR not owned" (same existence-non-leak posture as elsewhere).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { deleteGuest } from '@/lib/server/vipinvitoz/guests';

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const { id } = await ctx.params;

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

    await deleteGuest(prisma, guest.id);
    log.info('guest deleted', { ceremonyId: guest.ceremonyId, guestId: guest.id });

    return NextResponse.json({ ok: true });
  });
}
