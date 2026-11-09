// VipInvitoz — Invitation helpers.
//
// An Invitation is a per-guest instance with an opaque public URL (/i/[slug])
// and a QR token used at the door. The schema makes (guestId) unique via the
// Invitation.guestId FK + Prisma Guest.invitations[] relation, but the model
// itself allows multiple Invitations per guest (e.g. re-send). We keep "one
// active invitation per guest" as a product rule enforced here, not in schema.
//
// Slug: URL-safe base32 Crockford-ish via crypto.randomBytes. ~62 bits of
// entropy (12 chars from a 32-char alphabet). QR token: ~50 bits (10 chars).
// Both are regenerated on collision (very unlikely but defensively retried).

import 'server-only';

import { randomBytes } from 'node:crypto';
import type { Invitation, PrismaClient } from '@prisma/client';

// Crockford-ish base32 (no I/L/O/U to avoid visual confusion).
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomId(length: number): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

const SLUG_LENGTH = 12;
const QR_LENGTH = 10;
const MAX_ATTEMPTS = 5;

/**
 * Create an Invitation for a guest, or return the existing one.
 * Idempotent per guest: the first active invitation wins and future calls
 * return it. Collision-retries slug/qrToken on the extremely unlikely
 * unique-constraint hit.
 */
export async function ensureInvitationForGuest(
  prisma: PrismaClient,
  guestId: string,
): Promise<Invitation> {
  const existing = await prisma.invitation.findFirst({
    where: { guestId },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return existing;

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { ceremonyId: true },
  });
  if (!guest) {
    throw new Error(`Guest ${guestId} not found`);
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const slug = randomId(SLUG_LENGTH).toLowerCase();
    const qrToken = randomId(QR_LENGTH);
    try {
      return await prisma.invitation.create({
        data: {
          ceremonyId: guest.ceremonyId,
          guestId,
          slug,
          qrToken,
        },
      });
    } catch (err) {
      const code = err instanceof Error && 'code' in err ? (err as { code: string }).code : '';
      if (code === 'P2002') continue; // slug or qrToken collision — retry
      throw err;
    }
  }
  throw new Error('invitations: exhausted collision retries');
}

/**
 * Public-side read for /i/[slug]: returns the invitation plus the ceremony
 * header + first occasion. Everything a guest needs to see the invite.
 * Marks viewedAt on first open.
 */
export async function getInvitationBySlugForPublic(prisma: PrismaClient, slug: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: {
      guest: { select: { name: true } },
      ceremony: {
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          coverImageUrl: true,
          musicLabel: true,
          occasions: {
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  });
  if (!invitation) return null;

  if (!invitation.viewedAt) {
    // Fire and forget — first-open timestamp. Don't block the response on it.
    void prisma.invitation
      .update({ where: { id: invitation.id }, data: { viewedAt: new Date() } })
      .catch(() => {});
  }

  return invitation;
}

/**
 * Update RSVP + companion count for an invitation. No auth — the slug IS
 * the token. Called from the public /i/[slug] page.
 */
export async function setInvitationRsvp(
  prisma: PrismaClient,
  slug: string,
  input: { status: 'CONFIRMED' | 'DECLINED'; companionCount?: number },
): Promise<Invitation | null> {
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!invitation) return null;

  return prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      rsvpStatus: input.status,
      rsvpAt: new Date(),
      ...(input.companionCount !== undefined
        ? { companionCount: Math.max(0, Math.min(10, Math.floor(input.companionCount))) }
        : {}),
    },
  });
}
