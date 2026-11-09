// VIP-01 — Ceremonies CRUD root
//
// POST /api/ceremonies — create a new ceremony + its first occasion(s).
// GET  /api/ceremonies — list the caller's ceremonies.
//
// Freemium / Premium tier: maxCeremonies = 1 active DRAFT/ACTIVE row at a time
// (PRD §6 tier matrix; multi-cérémonie VIP-only per user-locked decision).
// VIP: unlimited (-1 sentinel on Subscription.maxCeremonies).
//
// Auto-provisions a FREEMIUM Subscription on first call if none exists —
// simpler than forcing a separate onboarding step in V1.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { ensureActiveSubscription } from '@/lib/server/vipinvitoz/subscription';

const CEREMONY_TYPES = ['MARIAGE', 'BAPTEME', 'ANNIVERSAIRE', 'DEUIL', 'AUTRE'] as const;

const OccasionBody = z.object({
  label: z.string().min(1).max(80),
  startsAt: z.coerce.date(),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60)
    .optional(),
  locationName: z.string().min(1).max(200),
  locationAddress: z.string().min(1).max(500),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  instructions: z.string().max(2000).optional(),
});

const Body = z.object({
  type: z.enum(CEREMONY_TYPES),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(1000),
  occasions: z.array(OccasionBody).min(1).max(10),
  coverImageUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
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
        { error: 'VALIDATION_FAILED', message: 'Invalid JSON body.' },
        { status: 400 },
      );
    }

    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Invalid ceremony payload.',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const subscription = await ensureActiveSubscription(prisma, userId);

    // Quota check — max active ceremonies per tier.
    if (subscription.maxCeremonies !== -1) {
      const activeCount = await prisma.ceremony.count({
        where: { userId, status: { in: ['DRAFT', 'ACTIVE'] } },
      });
      if (activeCount >= subscription.maxCeremonies) {
        return NextResponse.json(
          {
            error: 'CEREMONY_LIMIT_REACHED',
            message:
              subscription.tier === 'FREEMIUM'
                ? 'Votre palier Freemium est limité à 1 cérémonie. Passez en VIP pour en créer plusieurs.'
                : 'Votre palier Premium est limité à 1 cérémonie active. Passez en VIP pour en créer plusieurs.',
            tier: subscription.tier,
          },
          { status: 403 },
        );
      }
    }

    const { type, title, description, occasions, coverImageUrl } = parsed.data;

    const ceremony = await prisma.ceremony.create({
      data: {
        userId,
        type,
        title,
        description,
        status: 'DRAFT',
        ...(coverImageUrl ? { coverImageUrl } : {}),
        occasions: {
          create: occasions.map((o, i) => ({
            label: o.label,
            startsAt: o.startsAt,
            durationMinutes: o.durationMinutes ?? null,
            locationName: o.locationName,
            locationAddress: o.locationAddress,
            locationLat: o.locationLat ?? null,
            locationLng: o.locationLng ?? null,
            instructions: o.instructions ?? null,
            order: i,
          })),
        },
      },
      include: { occasions: { orderBy: { order: 'asc' } } },
    });

    log.info('ceremony created', {
      ceremonyId: ceremony.id,
      type,
      occasionCount: occasions.length,
    });

    return NextResponse.json({ ceremony }, { status: 201 });
  });
}

export async function GET(req: NextRequest) {
  const ctx = makeRequestContext(req.headers);
  return withRequestContext(ctx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const ceremonies = await prisma.ceremony.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      include: {
        occasions: { orderBy: { order: 'asc' } },
        _count: {
          select: {
            guests: true,
            invitations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ceremonies });
  });
}
