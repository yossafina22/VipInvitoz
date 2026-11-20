import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { createVendor, findOrCreateBudgetCategory, updateVendor, ImageUrlSchema } from './vendors';

const D = (v: number | string) => new Prisma.Decimal(v);

beforeEach(() => {
  prismaMock.$transaction.mockImplementation((async (fn: (tx: unknown) => unknown) =>
    fn(prismaMock)) as never);
});

describe('findOrCreateBudgetCategory', () => {
  it('reuses an existing category matched case-insensitively', async () => {
    prismaMock.budgetCategory.findFirst.mockResolvedValue({ id: 'c1' } as never);
    expect(await findOrCreateBudgetCategory(prismaMock as never, 'cer1', 'Traiteur')).toBe('c1');
    expect(prismaMock.budgetCategory.findFirst).toHaveBeenCalledWith({
      where: { ceremonyId: 'cer1', label: { equals: 'Traiteur', mode: 'insensitive' } },
      select: { id: true },
    });
    expect(prismaMock.budgetCategory.create).not.toHaveBeenCalled();
  });

  it('creates the category last when missing', async () => {
    prismaMock.budgetCategory.findFirst.mockResolvedValue(null);
    prismaMock.budgetCategory.aggregate.mockResolvedValue({ _max: { order: 4 } } as never);
    prismaMock.budgetCategory.create.mockResolvedValue({ id: 'new' } as never);
    expect(await findOrCreateBudgetCategory(prismaMock as never, 'cer1', 'Transport')).toBe('new');
    expect(prismaMock.budgetCategory.create.mock.calls[0]?.[0]?.data).toMatchObject({
      ceremonyId: 'cer1',
      label: 'Transport',
      order: 5,
    });
  });
});

describe('createVendor', () => {
  it('creates the vendor and a linked expense in the preset budget category', async () => {
    prismaMock.ceremony.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.budgetCategory.findFirst.mockResolvedValue({ id: 'cat-catering' } as never);
    prismaMock.vendor.create.mockResolvedValue({ id: 'v1' } as never);
    prismaMock.budgetExpense.create.mockResolvedValue({ id: 'e1' } as never);

    await createVendor(prismaMock as never, {
      ceremonyId: 'cer1',
      locale: 'fr',
      presetKey: 'catering',
      name: 'Chez Mama Fatou',
      imageUrl: null,
      phone: '+221771234567',
      amount: 820000,
      paid: false,
    });

    const cat = prismaMock.budgetCategory.findFirst.mock.calls[0]?.[0] as {
      where: { label: { equals: string } };
    };
    expect(cat.where.label.equals).toBe('Traiteur');
    expect(prismaMock.budgetExpense.create.mock.calls[0]?.[0]?.data).toMatchObject({
      ceremonyId: 'cer1',
      categoryId: 'cat-catering',
      vendorId: 'v1',
      label: 'Chez Mama Fatou',
      status: 'PENDING',
    });
    const exp = prismaMock.budgetExpense.create.mock.calls[0]?.[0]?.data as {
      unitAmount: Prisma.Decimal;
      quantity: Prisma.Decimal;
    };
    expect(exp.unitAmount.toFixed(2)).toBe('820000.00');
    expect(exp.quantity.toFixed(2)).toBe('1.00');
  });

  it('puts a custom vendor in the misc category (English) and marks paid as PAID', async () => {
    prismaMock.ceremony.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.budgetCategory.findFirst.mockResolvedValue({ id: 'cat-misc' } as never);
    prismaMock.vendor.create.mockResolvedValue({ id: 'v2' } as never);
    prismaMock.budgetExpense.create.mockResolvedValue({ id: 'e2' } as never);

    await createVendor(prismaMock as never, {
      ceremonyId: 'cer1',
      locale: 'en',
      presetKey: null,
      name: 'Security team',
      imageUrl: null,
      phone: null,
      amount: 50,
      paid: true,
    });

    const cat = prismaMock.budgetCategory.findFirst.mock.calls[0]?.[0] as {
      where: { label: { equals: string } };
    };
    expect(cat.where.label.equals).toBe('Miscellaneous');
    expect(prismaMock.budgetExpense.create.mock.calls[0]?.[0]?.data).toMatchObject({
      status: 'PAID',
    });
  });
});

describe('updateVendor', () => {
  it('mirrors name, amount and paid onto the linked expense', async () => {
    prismaMock.vendor.update.mockResolvedValue({
      id: 'v1',
      name: 'Mama Fatou',
      amount: D(900000),
      paid: true,
    } as never);
    prismaMock.budgetExpense.updateMany.mockResolvedValue({ count: 1 });

    await updateVendor(prismaMock as never, 'v1', {
      name: 'Mama Fatou',
      amount: 900000,
      paid: true,
    });

    const call = prismaMock.budgetExpense.updateMany.mock.calls[0]?.[0] as {
      where: unknown;
      data: { label: string; status: string; unitAmount: Prisma.Decimal };
    };
    expect(call.where).toEqual({ vendorId: 'v1' });
    expect(call.data.label).toBe('Mama Fatou');
    expect(call.data.status).toBe('PAID');
    expect(call.data.unitAmount.toFixed(2)).toBe('900000.00');
  });
});

describe('ImageUrlSchema', () => {
  it('accepts only https Cloudinary URLs', () => {
    expect(
      ImageUrlSchema.safeParse('https://res.cloudinary.com/demo/image/upload/a.jpg').success,
    ).toBe(true);
    expect(ImageUrlSchema.safeParse('https://evil.example/a.jpg').success).toBe(false);
    expect(ImageUrlSchema.safeParse('http://res.cloudinary.com/demo/a.jpg').success).toBe(false);
    expect(ImageUrlSchema.safeParse('javascript:alert(1)').success).toBe(false);
  });
});
