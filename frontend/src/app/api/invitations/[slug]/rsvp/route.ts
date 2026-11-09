// VIP-09 — Public RSVP endpoint.
//
// POST /api/invitations/[slug]/rsvp — body: { status, companionCount? }
//   status: 'CONFIRMED' | 'DECLINED'
//   companionCount: 0..10 (silently clamped)
//
// Public: the slug is the authorization. No CSRF (public endpoint carries
// no cookies). Rate-limited by IP.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createEmailLimiter } from '@/lib/server/middleware/rate-limit-by-email';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { redis } from '@/lib/server/redis';
import { setInvitationRsvp } from '@/lib/server/vipinvitoz/invitations';

const rsvpLimiter = createEmailLimiter(redis ? { redis } : {}, {
  bucket: 'invitation:rsvp',
  windowMs: 60_000,
  max: 20,
  code: 'TOO_MANY_REQUESTS',
  message: 'Trop de tentatives. Patientez un instant.',
});

const Body = z.object({
  status: z.enum(['CONFIRMED', 'DECLINED']),
  companionCount: z.number().int().min(0).max(10).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const limited = await rsvpLimiter.check(req, null);
    if (limited) return limited;

    const { slug } = await ctx.params;

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

    const input: { status: 'CONFIRMED' | 'DECLINED'; companionCount?: number } = {
      status: parsed.data.status,
      ...(parsed.data.companionCount !== undefined
        ? { companionCount: parsed.data.companionCount }
        : {}),
    };
    const updated = await setInvitationRsvp(prisma, slug, input);
    if (!updated) {
      return NextResponse.json(
        { error: 'INVITATION_NOT_FOUND', message: 'Invitation introuvable.' },
        { status: 404 },
      );
    }

    log.info('invitation rsvp', {
      invitationId: updated.id,
      status: parsed.data.status,
      companionCount: parsed.data.companionCount ?? updated.companionCount,
    });

    return NextResponse.json({
      invitation: {
        slug: updated.slug,
        rsvpStatus: updated.rsvpStatus,
        companionCount: updated.companionCount,
        rsvpAt: updated.rsvpAt?.toISOString() ?? null,
      },
    });
  });
}
