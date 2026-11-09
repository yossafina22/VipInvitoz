// VIP-15 — Send an invitation on a specific channel.
//
// POST /api/guests/[id]/invite/send — body: { channel: 'EMAIL' | 'WHATSAPP' | 'LINK' }
//   Organizer-only (verifyCsrf + requireAuth + ownership check).
//   Response: { invitation, publicUrl, channel, waUrl?, emailJobId?, emailQueueMissing? }
//
// Returns a RELATIVE publicUrl so the client absolutizes with
// window.location.origin (mirrors /api/guests/[id]/invite). For the wa.me
// deeplink, the server must have the absolute URL to embed in the message,
// so we take `?origin=` from the client (defaults to the request's origin).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { ensureInvitationForGuest } from '@/lib/server/vipinvitoz/invitations';
import { sendInvitationOnChannel } from '@/lib/server/vipinvitoz/invite-share';

const Body = z.object({
  channel: z.enum(['EMAIL', 'WHATSAPP', 'LINK']),
  /** Absolute base URL (e.g. https://vipinvitoz.app). Used to build wa.me and
   *  email links. Falls back to request origin. */
  origin: z.string().url().optional(),
});

function relativePublicUrl(slug: string): string {
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
          message: 'Canal invalide.',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const guest = await prisma.guest.findFirst({
      where: { id, ceremony: { userId } },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        ceremony: { select: { title: true } },
      },
    });
    if (!guest) {
      return NextResponse.json(
        { error: 'GUEST_NOT_FOUND', message: 'Invité introuvable.' },
        { status: 404 },
      );
    }

    if (parsed.data.channel === 'EMAIL' && !guest.email) {
      return NextResponse.json(
        { error: 'GUEST_EMAIL_MISSING', message: 'Cet invité n’a pas d’adresse email.' },
        { status: 400 },
      );
    }
    if (parsed.data.channel === 'WHATSAPP' && !guest.phone) {
      return NextResponse.json(
        { error: 'GUEST_PHONE_MISSING', message: 'Cet invité n’a pas de numéro de téléphone.' },
        { status: 400 },
      );
    }

    const invitation = await ensureInvitationForGuest(prisma, guest.id);

    // Prefer the client-supplied origin (they know what host their browser
    // sees). Fall back to the request's own origin — works for server-side
    // calls and keeps dev usable across ports.
    const origin = parsed.data.origin ?? new URL(req.url).origin;
    const publicUrl = `${origin.replace(/\/+$/, '')}${relativePublicUrl(invitation.slug)}`;

    const result = await sendInvitationOnChannel(
      prisma,
      {
        guest: { id: guest.id, name: guest.name, phone: guest.phone, email: guest.email },
        invitation,
        ceremony: { title: guest.ceremony.title },
        publicUrl,
      },
      parsed.data.channel,
    );

    log.info('invitation sent', {
      guestId: guest.id,
      invitationId: result.invitation.id,
      channel: parsed.data.channel,
      emailJobId: result.emailJobId ?? null,
      emailQueueMissing: result.emailQueueMissing ?? false,
    });

    return NextResponse.json({
      invitation: {
        id: result.invitation.id,
        slug: result.invitation.slug,
        channel: result.invitation.channel,
        sentAt: result.invitation.sentAt?.toISOString() ?? null,
      },
      publicUrl: relativePublicUrl(result.invitation.slug),
      channel: parsed.data.channel,
      ...(result.waUrl ? { waUrl: result.waUrl } : {}),
      ...(result.emailJobId ? { emailJobId: result.emailJobId } : {}),
      ...(result.emailQueueMissing ? { emailQueueMissing: true } : {}),
    });
  });
}
