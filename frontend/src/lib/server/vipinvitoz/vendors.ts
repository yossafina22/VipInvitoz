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

export async function findOrCreateBudgetCategory(
  tx: Tx,
  ceremonyId: string,
  label: string,
): Promise<string> {
  const existing = await tx.budgetCategory.findFirst({
    where: { ceremonyId, label: { equals: label, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const last = await tx.budgetCategory.aggregate({
    where: { ceremonyId },
    _max: { order: true },
  });
  const created = await tx.budgetCategory.create({
    data: { ceremonyId, label, order: (last._max.order ?? -1) + 1 },
    select: { id: true },
  });
  return created.id;
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
  const categoryLabel = DEFAULT_CATEGORY_LABELS[input.locale][index] ?? 'Divers';

  return prisma.$transaction(async (tx) => {
    const categoryId = await findOrCreateBudgetCategory(tx, input.ceremonyId, categoryLabel);
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
      },
    });
    return vendor;
  });
}

export function findOwnedVendor(
  prisma: PrismaClient,
  userId: string,
  vendorId: string,
): Promise<Vendor | null> {
  return prisma.vendor.findFirst({ where: { id: vendorId, ceremony: { userId } } });
}

export function serializeVendor(v: Vendor) {
  return {
    id: v.id,
    presetKey: v.presetKey,
    name: v.name,
    imageUrl: v.imageUrl,
    phone: v.phone,
    amount: v.amount.toFixed(2),
    paid: v.paid,
  };
}
