// VIP-14 — Dashboard aggregate stats.
//
// GET /api/dashboard/stats — organizer-only. Rolls counts up across the
// caller's DRAFT+ACTIVE ceremonies (archived/past are excluded). Returns:
//   - guestsTotal, guestsConfirmed, guestsDeclined, guestsPending
//   - companions (sum of companionCount over CONFIRMED invitations)
//   - invitationsTotal (number of Invitation rows, independent of Guests)
//   - aiCredits: { remaining, initial, unlimited }
//   - tier: FREEMIUM | PREMIUM | VIP

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/middleware';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import {
  ensureActiveSubscription,
  getTierSpec,
  type Tier,
} from '@/lib/server/vipinvitoz/subscription';

export async function GET(req: NextRequest) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const [subscription, ceremonies] = await Promise.all([
      ensureActiveSubscription(prisma, userId),
      prisma.ceremony.findMany({
        where: { userId, status: { in: ['DRAFT', 'ACTIVE'] } },
        select: { id: true },
      }),
    ]);

    const ceremonyIds = ceremonies.map((c) => c.id);

    if (ceremonyIds.length === 0) {
      const spec = getTierSpec(subscription.tier);
      return NextResponse.json({
        tier: subscription.tier as Tier,
        guestsTotal: 0,
        guestsConfirmed: 0,
        guestsDeclined: 0,
        guestsPending: 0,
        companions: 0,
        invitationsTotal: 0,
        aiCredits: {
          remaining: subscription.aiCreditsRemaining,
          initial: spec.initialAiCredits,
          unlimited: spec.initialAiCredits === -1,
        },
      });
    }

    const [guestsTotal, invitationsTotal, rsvpGroups, companionAgg] = await Promise.all([
      prisma.guest.count({ where: { ceremonyId: { in: ceremonyIds } } }),
      prisma.invitation.count({ where: { ceremonyId: { in: ceremonyIds } } }),
      prisma.invitation.groupBy({
        by: ['rsvpStatus'],
        where: { ceremonyId: { in: ceremonyIds } },
        _count: { _all: true },
      }),
      prisma.invitation.aggregate({
        where: { ceremonyId: { in: ceremonyIds }, rsvpStatus: 'CONFIRMED' },
        _sum: { companionCount: true },
      }),
    ]);

    const byStatus = new Map<string, number>();
    for (const row of rsvpGroups) {
      byStatus.set(row.rsvpStatus, row._count._all);
    }

    const guestsConfirmed = byStatus.get('CONFIRMED') ?? 0;
    const guestsDeclined = byStatus.get('DECLINED') ?? 0;
    // "RSVP en attente" = guests still to be reached + invited-but-not-answered.
    // A guest without an invitation is implicitly pending too.
    const guestsWithInvitation = invitationsTotal;
    const invitedPending = byStatus.get('PENDING') ?? 0;
    const notYetInvited = Math.max(0, guestsTotal - guestsWithInvitation);
    const guestsPending = invitedPending + notYetInvited;
    const companions = companionAgg._sum.companionCount ?? 0;

    const spec = getTierSpec(subscription.tier);

    return NextResponse.json({
      tier: subscription.tier as Tier,
      guestsTotal,
      guestsConfirmed,
      guestsDeclined,
      guestsPending,
      companions,
      invitationsTotal,
      aiCredits: {
        remaining: subscription.aiCreditsRemaining,
        initial: spec.initialAiCredits,
        unlimited: spec.initialAiCredits === -1,
      },
    });
  });
}
