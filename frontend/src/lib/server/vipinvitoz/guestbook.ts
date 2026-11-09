// VipInvitoz — Guestbook helpers.
//
// A GuestbookEntry is a text message left by a guest in a ceremony's livre
// d'or. Voice/video are intentionally out of scope in V1 (user-locked).
//
// Access rules (enforced at route level, documented here for context):
//   - Public write: anyone with a valid invitation slug may POST one entry.
//   - Public read:  the invited page /i/[slug] lists the ceremony's entries
//     (no auth required — guests see each other's messages).
//   - Organizer read: the ceremony owner reads from the dashboard /guestbook,
//     with pinned entries first.
//
// This module stays pure data-access: it NEVER checks permissions. The
// caller (route handler) is responsible for auth + ownership checks.

import 'server-only';

import type { GuestbookEntry, PrismaClient } from '@prisma/client';

export type GuestbookEntryWithAuthor = GuestbookEntry;

/**
 * List entries for a ceremony, pinned first, then by recency.
 * `limit` defaults to 100; callers paginating should pass a cursor via `before`.
 */
export async function listGuestbookEntriesForCeremony(
  prisma: PrismaClient,
  ceremonyId: string,
  options: { limit?: number; before?: Date } = {},
): Promise<GuestbookEntryWithAuthor[]> {
  const limit = Math.min(options.limit ?? 100, 500);
  return prisma.guestbookEntry.findMany({
    where: {
      ceremonyId,
      ...(options.before ? { createdAt: { lt: options.before } } : {}),
    },
    orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: limit,
  });
}

/** Create one entry. Caller must have validated the invitation slug (if any). */
export async function createGuestbookEntry(
  prisma: PrismaClient,
  input: {
    ceremonyId: string;
    authorName: string;
    content: string;
    invitationId?: string;
  },
): Promise<GuestbookEntry> {
  return prisma.guestbookEntry.create({
    data: {
      ceremonyId: input.ceremonyId,
      authorName: input.authorName.trim(),
      content: input.content.trim(),
      invitationId: input.invitationId ?? null,
    },
  });
}

/** Pin / unpin an entry. Caller must have verified ceremony ownership. */
export async function setGuestbookEntryPinned(
  prisma: PrismaClient,
  entryId: string,
  pinned: boolean,
): Promise<GuestbookEntry> {
  return prisma.guestbookEntry.update({
    where: { id: entryId },
    data: { pinnedAt: pinned ? new Date() : null },
  });
}
