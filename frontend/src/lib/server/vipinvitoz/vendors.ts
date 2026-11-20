// VIP vendors. Each vendor's amount is mirrored by one BudgetExpense
// (vendorId, quantity 1, PAID if paid else PENDING) so it adds straight into
// the budget. The expense is created/updated in the same transaction.

import 'server-only';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { PrismaClient, Vendor } from '@prisma/client';
import {
  CUSTOM_VENDOR_CATEGORY_INDEX,
  VENDOR_PRESETS,
  isVendorPresetKey,
} from '@/lib/vendors/presets';
import { normalizePhone } from '@/lib/vendors/contact';
import { DEFAULT_CATEGORY_LABELS, seedBudgetIfNeeded, type BudgetLocale } from './budget';

type Tx = Prisma.TransactionClient | PrismaClient;

// Only our own uploads: an arbitrary URL would let a page embed tracking pixels.
export const ImageUrlSchema = z
  .string()
  .url()
  .max(500)
  .refine((u) => u.startsWith('https://res.cloudinary.com/'), { message: 'IMAGE_HOST' });

export const PhoneSchema = z.string().transform((raw, ctx) => {
  const phone = normalizePhone(raw);
  if (!phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'PHONE_INVALID' });
    return z.NEVER;
  }
  return phone;
});

export const PresetKeySchema = z.string().refine(isVendorPresetKey, { message: 'PRESET_UNKNOWN' });

function expenseStatus(paid: boolean): 'PAID' | 'PENDING' {
  return paid ? 'PAID' : 'PENDING';
}

// Matches any of `labels` (the default label in every locale, so a budget
// seeded in French is found from the English UI); creates it under labels[0].
export async function findOrCreateBudgetCategory(
  tx: Tx,
  ceremonyId: string,
  labels: readonly [string, ...string[]],
): Promise<string> {
  const existing = await tx.budgetCategory.findFirst({
    where: {
      ceremonyId,
      OR: labels.map((label) => ({ label: { equals: label, mode: 'insensitive' as const } })),
    },
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  if (existing) return existing.id;
  const last = await tx.budgetCategory.aggregate({
    where: { ceremonyId },
    _max: { order: true },
  });
  const created = await tx.budgetCategory.create({
    data: { ceremonyId, label: labels[0], order: (last._max.order ?? -1) + 1 },
    select: { id: true },
  });
  return created.id;
}

function defaultCategoryLabels(
  locale: BudgetLocale,
  index: number,
): readonly [string, ...string[]] {
  const other: BudgetLocale = locale === 'fr' ? 'en' : 'fr';
  const own = DEFAULT_CATEGORY_LABELS[locale][index] ?? 'Divers';
  const alt = DEFAULT_CATEGORY_LABELS[other][index];
  return alt ? [own, alt] : [own];
}

export interface CreateVendorInput {
  ceremonyId: string;
  locale: BudgetLocale;
  presetKey: string | null;
  name: string;
  imageUrl: string | null;
  phone: string | null;
  amount: number;
  paid: boolean;
  /** A category of this ceremony the caller already checked; omitted → preset default. */
  categoryId?: string | null;
}

export async function createVendor(
  prisma: PrismaClient,
  input: CreateVendorInput,
): Promise<Vendor> {
  // Seed the default categories first so the vendor's category matches them
  // instead of creating a lone duplicate the budget page would seed later.
  await seedBudgetIfNeeded(prisma, input.ceremonyId, input.locale);

  const index =
    input.presetKey && isVendorPresetKey(input.presetKey)
      ? VENDOR_PRESETS[input.presetKey].budgetCategoryIndex
      : CUSTOM_VENDOR_CATEGORY_INDEX;

  return prisma.$transaction(async (tx) => {
    const categoryId =
      input.categoryId ??
      (await findOrCreateBudgetCategory(
        tx,
        input.ceremonyId,
        defaultCategoryLabels(input.locale, index),
      ));
    const amount = new Prisma.Decimal(input.amount);
    const vendor = await tx.vendor.create({
      data: {
        ceremonyId: input.ceremonyId,
        presetKey: input.presetKey,
        name: input.name,
        imageUrl: input.imageUrl,
        phone: input.phone,
        amount,
        paid: input.paid,
      },
    });
    await tx.budgetExpense.create({
      data: {
        ceremonyId: input.ceremonyId,
        categoryId,
        vendorId: vendor.id,
        label: input.name,
        quantity: new Prisma.Decimal(1),
        unitAmount: amount,
        status: expenseStatus(input.paid),
      },
    });
    return vendor;
  });
}

export interface UpdateVendorInput {
  name?: string;
  imageUrl?: string | null;
  phone?: string | null;
  amount?: number;
  paid?: boolean;
  /** A category of the vendor's ceremony the caller already checked. */
  categoryId?: string;
}

export async function updateVendor(
  prisma: PrismaClient,
  vendorId: string,
  patch: UpdateVendorInput,
): Promise<Vendor> {
  return prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.update({
      where: { id: vendorId },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.amount !== undefined ? { amount: new Prisma.Decimal(patch.amount) } : {}),
        ...(patch.paid !== undefined ? { paid: patch.paid } : {}),
      },
    });
    await tx.budgetExpense.updateMany({
      where: { vendorId },
      data: {
        label: vendor.name,
        unitAmount: vendor.amount,
        status: expenseStatus(vendor.paid),
        ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId } : {}),
      },
    });
    return vendor;
  });
}

// The caller owns the vendor/ceremony; this keeps a category id from
// another ceremony (even one the caller owns) out of its budget.
export async function categoryInCeremony(
  prisma: PrismaClient,
  categoryId: string,
  ceremonyId: string,
): Promise<boolean> {
  const found = await prisma.budgetCategory.findFirst({
    where: { id: categoryId, ceremonyId },
    select: { id: true },
  });
  return found !== null;
}

export function findOwnedVendor(
  prisma: PrismaClient,
  userId: string,
  vendorId: string,
): Promise<Vendor | null> {
  return prisma.vendor.findFirst({ where: { id: vendorId, ceremony: { userId } } });
}

export function serializeVendor(v: Vendor & { expense?: { categoryId: string } | null }) {
  return {
    id: v.id,
    presetKey: v.presetKey,
    name: v.name,
    imageUrl: v.imageUrl,
    phone: v.phone,
    amount: v.amount.toFixed(2),
    paid: v.paid,
    categoryId: v.expense?.categoryId ?? null,
  };
}
