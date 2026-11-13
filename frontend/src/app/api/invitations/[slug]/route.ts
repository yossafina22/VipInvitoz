// VIP-08 — Public invitation read endpoint.
//
// GET /api/invitations/[slug] — the /i/[slug] page's data source.
// No auth: the slug is the authorization. Rate-limited by IP to deter
// mass enumeration of random slugs.
//
// Returns the ceremony header + first-occasion details + RSVP state so the
// guest can see everything in a single round-trip. Marks viewedAt on first
// open (side-effect inside the helper, fire-and-forget).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createEmailLimiter } from '@/lib/server/middleware/rate-limit-by-email';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { redis } from '@/lib/server/redis';
import { getInvitationBySlugForPublic } from '@/lib/server/vipinvitoz/invitations';

const readLimiter = createEmailLimiter(redis ? { redis } : {}, {
  bucket: 'invitation:read',
  windowMs: 60_000,
  max: 120,
  code: 'TOO_MANY_REQUESTS',
  message: 'Trop de requêtes. Patientez un instant.',
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const limited = await readLimiter.check(req, null);
    if (limited) return limited;

    const { slug } = await ctx.params;

    const invitation = await getInvitationBySlugForPublic(prisma, slug);
    if (!invitation) {
      return NextResponse.json(
        { error: 'INVITATION_NOT_FOUND', message: 'Invitation introuvable.' },
        { status: 404 },
      );
    }

    const firstOcc = invitation.ceremony.occasions[0];

    return NextResponse.json({
      invitation: {
        slug: invitation.slug,
        rsvpStatus: invitation.rsvpStatus,
        companionCount: invitation.companionCount,
      },
      guest: {
        name: invitation.guest.name,
      },
      ceremony: {
        id: invitation.ceremony.id,
        type: invitation.ceremony.type,
        title: invitation.ceremony.title,
        description: invitation.ceremony.description,
        coverImageUrl: invitation.ceremony.coverImageUrl,
        musicLabel: invitation.ceremony.musicLabel,
        invitationJson: invitation.ceremony.invitationJson,
      },
      occasions: invitation.ceremony.occasions.map((o) => ({
        id: o.id,
        label: o.label,
        startsAt: o.startsAt.toISOString(),
        durationMinutes: o.durationMinutes,
        locationName: o.locationName,
        locationAddress: o.locationAddress,
        locationLat: o.locationLat,
        locationLng: o.locationLng,
        instructions: o.instructions,
      })),
      firstOccasion: firstOcc
        ? {
            startsAt: firstOcc.startsAt.toISOString(),
            locationName: firstOcc.locationName,
          }
        : null,
    });
  });
}
