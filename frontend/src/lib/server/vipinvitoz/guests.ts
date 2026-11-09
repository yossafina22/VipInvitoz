// VipInvitoz — Guest helpers.
//
// Pure data-access. Callers (route handlers) handle auth + ownership.
// Guests are per-ceremony. (ceremonyId, phone) is unique in schema, so
// the create helper surfaces the Prisma P2002 as a stable error code.

import 'server-only';

import type { Guest, PrismaClient } from '@prisma/client';

export class GuestConflictError extends Error {
  readonly code = 'GUEST_PHONE_DUPLICATE';
  constructor(message = 'Un invité avec ce numéro existe déjà dans cette cérémonie.') {
    super(message);
    this.name = 'GuestConflictError';
  }
}

export async function listGuestsForCeremony(
  prisma: PrismaClient,
  ceremonyId: string,
): Promise<Guest[]> {
  return prisma.guest.findMany({
    where: { ceremonyId },
    orderBy: [{ createdAt: 'asc' }],
    take: 1000,
  });
}

export async function createGuest(
  prisma: PrismaClient,
  input: {
    ceremonyId: string;
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
  },
): Promise<Guest> {
  try {
    return await prisma.guest.create({
      data: {
        ceremonyId: input.ceremonyId,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      throw new GuestConflictError();
    }
    throw err;
  }
}

export async function deleteGuest(prisma: PrismaClient, guestId: string): Promise<void> {
  await prisma.guest.delete({ where: { id: guestId } });
}
