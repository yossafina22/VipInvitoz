import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_CATEGORY_LABELS,
  MoneySchema,
  QuantitySchema,
  computeBudgetSummary,
  lineTotal,
  resolveOwnedCeremonyId,
  seedBudgetIfNeeded,
  toBudgetCsv,
  type ExpenseStatus,
} from './budget';

const D = (v: string | number) => new Prisma.Decimal(v);

function exp(categoryId: string, q: number | string, u: string, status: ExpenseStatus) {
  return { categoryId, quantity: D(q), unitAmount: D(u), status };
}

describe('lineTotal', () => {
  it('multiplies quantity by unit amount', () => {
    expect(lineTotal(D(200), D(500)).toFixed(2)).toBe('100000.00');
  });
});

describe('computeBudgetSummary', () => {
  it('sums decimals exactly', () => {
    const s = computeBudgetSummary(
      [{ id: 'c1', planned: D(1) }],
      [exp('c1', 3, '0.10', 'PAID'), exp('c1', 1, '0.20', 'PENDING')],
    );
    expect(s.spent).toBe('0.50');
  });

  it('counts PLANNED as upcoming, not spent', () => {
    const s = computeBudgetSummary(
      [{ id: 'c1', planned: D(500) }],
      [exp('c1', 1, '100', 'PLANNED')],
    );
    expect(s.spent).toBe('0.00');
    expect(s.upcoming).toBe('100.00');
    expect(s.byCategory.c1?.upcoming).toBe('100.00');
  });

  it('flags over budget per category and in total', () => {
    const s = computeBudgetSummary([{ id: 'c1', planned: D(100) }], [exp('c1', 1, '150', 'PAID')]);
    expect(s.over).toBe(true);
    expect(s.remaining).toBe('-50.00');
    expect(s.percentSpent).toBe(150);
    expect(s.byCategory.c1?.over).toBe(true);
  });

  it('gives 0 percent when nothing is planned', () => {
    const s = computeBudgetSummary([], [exp('c1', 1, '10', 'PAID')]);
    expect(s.percentSpent).toBe(0);
    expect(s.totalPlanned).toBe('0.00');
  });
});

describe('seedBudgetIfNeeded', () => {
  it('seeds 6 categories in English once', async () => {
    prismaMock.$transaction.mockImplementation((async (fn: (tx: unknown) => unknown) =>
      fn(prismaMock)) as never);
    prismaMock.ceremony.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.budgetCategory.createMany.mockResolvedValue({ count: 6 });

    await seedBudgetIfNeeded(prismaMock as never, 'cer1', 'en');

    expect(prismaMock.ceremony.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cer1', budgetSeededAt: null } }),
    );
    const call = prismaMock.budgetCategory.createMany.mock.calls[0]?.[0];
    const data = call?.data as { label: string; order: number; ceremonyId: string }[];
    expect(data.map((d) => d.label)).toEqual([...DEFAULT_CATEGORY_LABELS.en]);
    expect(data.map((d) => d.order)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(data.every((d) => d.ceremonyId === 'cer1')).toBe(true);
  });

  it('seed is skipped when claim count is 0', async () => {
    prismaMock.$transaction.mockImplementation((async (fn: (tx: unknown) => unknown) =>
      fn(prismaMock)) as never);
    prismaMock.ceremony.updateMany.mockResolvedValue({ count: 0 });

    await seedBudgetIfNeeded(prismaMock as never, 'cer1', 'fr');

    expect(prismaMock.budgetCategory.createMany).not.toHaveBeenCalled();
  });
});

describe('resolveOwnedCeremonyId', () => {
  it('returns notFound for a foreign id', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue(null);
    expect(await resolveOwnedCeremonyId(prismaMock as never, 'u1', 'other')).toEqual({
      ceremonyId: null,
      notFound: true,
    });
    expect(prismaMock.ceremony.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'other', userId: 'u1' } }),
    );
  });

  it('falls back to the most recent active ceremony', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue({ id: 'recent' } as never);
    expect(await resolveOwnedCeremonyId(prismaMock as never, 'u1', null)).toEqual({
      ceremonyId: 'recent',
      notFound: false,
    });
  });
});

describe('toBudgetCsv', () => {
  const headers = ['Date', 'Poste', 'Libellé', 'Quantité', 'Prix unitaire', 'Total', 'Statut'];

  it('neutralises formulas and escapes separators', () => {
    const csv = toBudgetCsv(
      [
        {
          date: new Date('2026-12-01T10:00:00Z'),
          category: 'Traiteur',
          label: '=SUM(A1)',
          quantity: '1.00',
          unitAmount: '10.00',
          total: '10.00',
          status: 'Payé',
        },
        {
          date: null,
          category: 'a;b"c',
          label: 'ok',
          quantity: '2.00',
          unitAmount: '5.00',
          total: '10.00',
          status: 'Prévu',
        },
      ],
      headers,
      'fr',
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe(headers.join(';'));
    expect(lines[1]).toBe("2026-12-01;Traiteur;'=SUM(A1);1,00;10,00;10,00;Payé");
    expect(lines[2]).toBe(';"a;b""c";ok;2,00;5,00;10,00;Prévu');
  });

  it('uses comma separator and dot decimals for English Excel', () => {
    const csv = toBudgetCsv(
      [
        {
          date: null,
          category: 'Venue, decor',
          label: 'Chairs',
          quantity: '200.00',
          unitAmount: '5.50',
          total: '1100.00',
          status: 'Paid',
        },
      ],
      ['Date', 'Category', 'Label', 'Quantity', 'Unit amount', 'Total', 'Status'],
      'en',
    );
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('Date,Category,Label,Quantity,Unit amount,Total,Status');
    expect(lines[1]).toBe(',"Venue, decor",Chairs,200.00,5.50,1100.00,Paid');
  });
});

describe('MoneySchema / QuantitySchema', () => {
  it('accepts 2 decimals and rejects 3', () => {
    expect(MoneySchema.safeParse(11.99).success).toBe(true);
    expect(MoneySchema.safeParse(1.234).success).toBe(false);
  });

  it('rejects negatives and a zero quantity', () => {
    expect(MoneySchema.safeParse(-1).success).toBe(false);
    expect(QuantitySchema.safeParse(0).success).toBe(false);
    expect(QuantitySchema.safeParse(0.5).success).toBe(true);
  });
});

describe('MoneySchema precision on large amounts', () => {
  it('accepts cents on amounts above 131072', () => {
    expect(MoneySchema.safeParse(1234567.89).success).toBe(true);
    expect(MoneySchema.safeParse(131072.11).success).toBe(true);
    expect(MoneySchema.safeParse(999999999999.99).success).toBe(true);
  });

  it('still rejects a third decimal on large amounts', () => {
    expect(MoneySchema.safeParse(1234567.891).success).toBe(false);
  });
});
