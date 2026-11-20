import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { jsonRequest } from '@/test-utils/json-request';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/tier-guard', () => ({ requireTier: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import { POST } from './route';

const URL = 'http://test/api/budget/expenses';
const D = (v: number | string) => new Prisma.Decimal(v);
const valid = {
  categoryId: 'c1',
  label: 'Chaises',
  quantity: 200,
  unitAmount: 500,
  status: 'PAID',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  vi.mocked(requireTier).mockResolvedValue(null);
});

describe('POST /api/budget/expenses', () => {
  it('returns 404 for a category that is not the caller', async () => {
    prismaMock.budgetCategory.findFirst.mockResolvedValue(null);
    const res = await POST(jsonRequest(URL, 'POST', valid));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('CATEGORY_NOT_FOUND');
    expect(prismaMock.budgetExpense.create).not.toHaveBeenCalled();
  });

  it('rejects an unknown status', async () => {
    const res = await POST(jsonRequest(URL, 'POST', { ...valid, status: 'DONE' }));
    expect(res.status).toBe(400);
  });

  it('rejects a zero quantity', async () => {
    const res = await POST(jsonRequest(URL, 'POST', { ...valid, quantity: 0 }));
    expect(res.status).toBe(400);
  });

  it('rejects a malformed date', async () => {
    const res = await POST(jsonRequest(URL, 'POST', { ...valid, date: '01/12/2026' }));
    expect(res.status).toBe(400);
  });

  it('creates the expense in the category ceremony and returns its total', async () => {
    prismaMock.budgetCategory.findFirst.mockResolvedValue({
      id: 'c1',
      ceremonyId: 'cer1',
    } as never);
    prismaMock.budgetExpense.create.mockResolvedValue({
      id: 'e1',
      categoryId: 'c1',
      label: 'Chaises',
      quantity: D(200),
      unitAmount: D(500),
      status: 'PAID',
      date: new Date('2026-12-01T00:00:00Z'),
    } as never);

    const res = await POST(
      jsonRequest(URL, 'POST', { ...valid, date: '2026-12-01', ceremonyId: 'x' }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).expense).toMatchObject({ total: '100000.00', date: '2026-12-01' });
    const data = prismaMock.budgetExpense.create.mock.calls[0]?.[0]?.data as {
      ceremonyId: string;
    };
    expect(data.ceremonyId).toBe('cer1');
  });

  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    expect((await POST(jsonRequest(URL, 'POST', valid))).status).toBe(403);
  });
});
