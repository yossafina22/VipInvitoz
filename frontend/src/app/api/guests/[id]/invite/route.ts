// VIP-07 — Generate / fetch an Invitation for a guest.
//
// POST /api/guests/[id]/invite — returns { invitation: { id, slug, qrToken,
//   rsvpStatus, companionCount, sentAt, viewedAt, checkedInAt }, publicUrl }
//
// Idempotent: if the guest already has an invitation, returns it; otherwise
// creates one. Organizer-only (verifyCsrf + requireAuth + ownership check
// via the guest's ceremony).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { ensureInvitationForGuest } from '@/lib/server/vipinvitoz/invitations';

// Returns a RELATIVE path. The client absolutizes with window.location.origin,
// so the URL always matches the actual browser (works across dev ports, prod
// domain, tunnels, etc.) without needing APP_URL to be in sync.
function publicUrlFor(slug: string): string {
  return `/i/${slug}`;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const { id } = await ctx.params;

    // Ownership: the guest must belong to a ceremony the caller owns.
    const guest = await prisma.guest.findFirst({
      where: { id, ceremony: { userId } },
      select: { id: true },
    });
    if (!guest) {
      return NextResponse.json(
        { error: 'GUEST_NOT_FOUND', message: 'Invité introuvable.' },
        { status: 404 },
      );
    }

    const invitation = await ensureInvitationForGuest(prisma, guest.id);

    log.info('invitation ensured', { guestId: guest.id, invitationId: invitation.id });

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          slug: invitation.slug,
          qrToken: invitation.qrToken,
          rsvpStatus: invitation.rsvpStatus,
          companionCount: invitation.companionCount,
          sentAt: invitation.sentAt?.toISOString() ?? null,
          viewedAt: invitation.viewedAt?.toISOString() ?? null,
          checkedInAt: invitation.checkedInAt?.toISOString() ?? null,
        },
        publicUrl: publicUrlFor(invitation.slug),
      },
      { status: 201 },
    );
  });
}
