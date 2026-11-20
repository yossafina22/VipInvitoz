import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/tier-guard', () => ({ requireTier: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import { GET } from './route';

const mockAuth = vi.mocked(requireAuth);
const mockTier = vi.mocked(requireTier);
const D = (v: number | string) => new Prisma.Decimal(v);

function get(qs = ''): NextRequest {
  return new NextRequest(`http://test/api/budget${qs}`, { method: 'GET' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  mockTier.mockResolvedValue(null);
  prismaMock.$transaction.mockImplementation((async (fn: (tx: unknown) => unknown) =>
    fn(prismaMock)) as never);
});

describe('GET /api/budget', () => {
  it('passes through a 401 from requireAuth', async () => {
    mockAuth.mockResolvedValueOnce(NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }));
    expect((await GET(get())).status).toBe(401);
  });

  it('returns 403 TIER_REQUIRED for a non-VIP', async () => {
    mockTier.mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    const res = await GET(get());
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('TIER_REQUIRED');
    expect(prismaMock.ceremony.findFirst).not.toHaveBeenCalled();
  });

  it('returns 404 for a ceremony that is not the caller', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue(null);
    const res = await GET(get('?ceremonyId=foreign'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('CEREMONY_NOT_FOUND');
  });

  it('returns an empty budget when the user has no ceremony', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue(null);
    const res = await GET(get());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ceremonyId).toBeNull();
    expect(body.categories).toEqual([]);
    expect(body.summary.spent).toBe('0.00');
  });

  it('seeds in the requested locale and returns totals as strings', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue({ id: 'cer1' } as never);
    prismaMock.ceremony.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.budgetCategory.findMany.mockResolvedValue([
      { id: 'c1', label: 'Catering', planned: D(1000), order: 0 },
    ] as never);
    prismaMock.budgetExpense.findMany.mockResolvedValue([
      {
        id: 'e1',
        categoryId: 'c1',
        label: 'Chairs',
        quantity: D(200),
        unitAmount: D(5),
        status: 'PAID',
        date: new Date('2026-12-01T00:00:00Z'),
        vendorId: 'v1',
      },
    ] as never);
    prismaMock.ceremonyOccasion.findFirst.mockResolvedValue(null);

    const res = await GET(get('?locale=en'));
    expect(res.status).toBe(200);
    const body = await res.json();

    const seedLabels = (
      prismaMock.budgetCategory.createMany.mock.calls[0]?.[0]?.data as { label: string }[]
    ).map((d) => d.label);
    expect(seedLabels[0]).toBe('Venue & decor');
    expect(body.ceremonyId).toBe('cer1');
    expect(body.categories[0]).toMatchObject({
      id: 'c1',
      label: 'Catering',
      planned: '1000.00',
      spent: '1000.00',
      over: false,
    });
    expect(body.expenses[0]).toMatchObject({
      id: 'e1',
      quantity: '200.00',
      unitAmount: '5.00',
      total: '1000.00',
      status: 'PAID',
      date: '2026-12-01',
      vendorId: 'v1',
    });
    expect(body.summary).toMatchObject({ spent: '1000.00', percentSpent: 100 });
    expect(body.daysUntil).toBeNull();
  });
});
