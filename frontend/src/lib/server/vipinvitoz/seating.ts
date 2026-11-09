// VipInvitoz — Seating helpers.
//
// Pure data-access. Route handlers handle auth + ownership checks.
// A SeatingTable belongs to a Ceremony; guests reference it via
// Guest.seatingTableId (nullable, onDelete: SetNull). Capacity is a SOFT
// cap — we never reject an assignment that over-seats a table because
// the organizer knows their event better than our constant.

import 'server-only';

import type { Guest, PrismaClient, SeatingTable } from '@prisma/client';

export type SeatingTableWithGuests = SeatingTable & { guests: Guest[] };

export async function listSeatingForCeremony(
  prisma: PrismaClient,
  ceremonyId: string,
): Promise<{ tables: SeatingTableWithGuests[]; unassigned: Guest[] }> {
  const [tables, unassigned] = await Promise.all([
    prisma.seatingTable.findMany({
      where: { ceremonyId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        guests: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.guest.findMany({
      where: { ceremonyId, seatingTableId: null },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  return { tables, unassigned };
}

export async function createSeatingTable(
  prisma: PrismaClient,
  input: { ceremonyId: string; label: string; capacity?: number },
): Promise<SeatingTable> {
  const maxOrder = await prisma.seatingTable.aggregate({
    where: { ceremonyId: input.ceremonyId },
    _max: { order: true },
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;
  return prisma.seatingTable.create({
    data: {
      ceremonyId: input.ceremonyId,
      label: input.label.trim(),
      capacity: input.capacity ?? 8,
      order: nextOrder,
    },
  });
}

export async function deleteSeatingTable(prisma: PrismaClient, tableId: string): Promise<void> {
  // onDelete: SetNull on Guest.seatingTableId handles unseating.
  await prisma.seatingTable.delete({ where: { id: tableId } });
}

export async function updateSeatingTable(
  prisma: PrismaClient,
  tableId: string,
  patch: { label?: string; capacity?: number },
): Promise<SeatingTable> {
  return prisma.seatingTable.update({
    where: { id: tableId },
    data: {
      ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
      ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
    },
  });
}

/**
 * Assign a guest to a table, or clear the assignment when tableId is null.
 * Caller must have verified that both the guest and the table (if provided)
 * belong to a ceremony the caller owns.
 */
export async function assignGuestToTable(
  prisma: PrismaClient,
  guestId: string,
  tableId: string | null,
): Promise<Guest> {
  return prisma.guest.update({
    where: { id: guestId },
    data: { seatingTableId: tableId },
  });
}
