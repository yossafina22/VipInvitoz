// VIP-03 — Guestbook public endpoints (invitation slug scoped).
//
// GET  /api/invitations/[slug]/guestbook — list entries (guests see each
//      other's messages on the /i/[slug] page).
// POST /api/invitations/[slug]/guestbook — guest submits an entry.
//
// Both are PUBLIC: the invitation slug IS the authorization. Anyone with
// the link may read / write, so we lean on rate limits by IP for abuse
// protection (no CSRF needed — public endpoints carry no cookies).
//
// Entry is linked to the invitation that submitted it (invitationId), so
// the organizer can later see "which invité wrote this".

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createEmailLimiter } from '@/lib/server/middleware/rate-limit-by-email';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { redis } from '@/lib/server/redis';
import {
  createGuestbookEntry,
  listGuestbookEntriesForCeremony,
} from '@/lib/server/vipinvitoz/guestbook';

// Passing email=null to createEmailLimiter falls back to the IP bucket.
const writeLimiter = createEmailLimiter(redis ? { redis } : {}, {
  bucket: 'invitation:guestbook:write',
  windowMs: 60_000,
  max: 10,
  code: 'TOO_MANY_REQUESTS',
  message: 'Trop de messages. Patientez un instant avant de réessayer.',
});

const readLimiter = createEmailLimiter(redis ? { redis } : {}, {
  bucket: 'invitation:guestbook:read',
  windowMs: 60_000,
  max: 60,
  code: 'TOO_MANY_REQUESTS',
  message: 'Trop de requêtes. Patientez un instant.',
});

const WriteBody = z.object({
  authorName: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(2000),
});

async function resolveInvitation(slug: string) {
  return prisma.invitation.findUnique({
    where: { slug },
    select: { id: true, ceremonyId: true },
  });
}

function serialize(entry: {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  pinnedAt: Date | null;
}) {
  return {
    id: entry.id,
    authorName: entry.authorName,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    pinnedAt: entry.pinnedAt?.toISOString() ?? null,
  };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const limited = await readLimiter.check(req, null);
    if (limited) return limited;

    const { slug } = await ctx.params;
    const invitation = await resolveInvitation(slug);
    if (!invitation) {
      return NextResponse.json(
        { error: 'INVITATION_NOT_FOUND', message: 'Invitation introuvable.' },
        { status: 404 },
      );
    }

    const entries = await listGuestbookEntriesForCeremony(prisma, invitation.ceremonyId);

    return NextResponse.json({ entries: entries.map(serialize) });
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const limited = await writeLimiter.check(req, null);
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

    const parsed = WriteBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Message invalide.',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const invitation = await resolveInvitation(slug);
    if (!invitation) {
      return NextResponse.json(
        { error: 'INVITATION_NOT_FOUND', message: 'Invitation introuvable.' },
        { status: 404 },
      );
    }

    const entry = await createGuestbookEntry(prisma, {
      ceremonyId: invitation.ceremonyId,
      invitationId: invitation.id,
      authorName: parsed.data.authorName,
      content: parsed.data.content,
    });

    log.info('guestbook entry created', {
      ceremonyId: invitation.ceremonyId,
      invitationId: invitation.id,
      entryId: entry.id,
    });

    return NextResponse.json({ entry: serialize(entry) }, { status: 201 });
  });
}
