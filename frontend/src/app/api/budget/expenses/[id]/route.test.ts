import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { jsonRequest, params } from '@/test-utils/json-request';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/tier-guard', () => ({ requireTier: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import { DELETE, PATCH } from './route';

const URL = 'http://test/api/budget/expenses/e1';
const D = (v: number | string) => new Prisma.Decimal(v);
const ownedExpense = {
  id: 'e1',
  ceremonyId: 'cer1',
  categoryId: 'c1',
  label: 'Chaises',
  quantity: D(200),
  unitAmount: D(500),
  status: 'PLANNED',
  date: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  vi.mocked(requireTier).mockResolvedValue(null);
});

describe('PATCH /api/budget/expenses/[id]', () => {
  it('returns 404 for an expense that is not the caller', async () => {
    prismaMock.budgetExpense.findFirst.mockResolvedValue(null);
    const res = await PATCH(jsonRequest(URL, 'PATCH', { status: 'PAID' }), params('e1'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('EXPENSE_NOT_FOUND');
  });

  it("refuses to move the expense to a category of the caller's other ceremony", async () => {
    prismaMock.budgetExpense.findFirst.mockResolvedValue(ownedExpense as never);
    prismaMock.budgetCategory.findFirst.mockResolvedValue({
      id: 'c-other',
      ceremonyId: 'cer2',
    } as never);
    const res = await PATCH(jsonRequest(URL, 'PATCH', { categoryId: 'c-other' }), params('e1'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('CATEGORY_NOT_FOUND');
    expect(prismaMock.budgetExpense.update).not.toHaveBeenCalled();
  });

  it('updates status and clears the date', async () => {
    prismaMock.budgetExpense.findFirst.mockResolvedValue(ownedExpense as never);
    prismaMock.budgetExpense.update.mockResolvedValue({ ...ownedExpense, status: 'PAID' } as never);
    const res = await PATCH(
      jsonRequest(URL, 'PATCH', { status: 'PAID', date: null }),
      params('e1'),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).expense).toMatchObject({ status: 'PAID', total: '100000.00' });
    expect(prismaMock.budgetExpense.update.mock.calls[0]?.[0]?.data).toMatchObject({
      status: 'PAID',
      date: null,
    });
  });

  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    expect((await PATCH(jsonRequest(URL, 'PATCH', { status: 'PAID' }), params('e1'))).status).toBe(
      403,
    );
  });
});

describe('DELETE /api/budget/expenses/[id]', () => {
  it('returns 404 for an expense that is not the caller', async () => {
    prismaMock.budgetExpense.findFirst.mockResolvedValue(null);
    expect((await DELETE(jsonRequest(URL, 'DELETE'), params('e1'))).status).toBe(404);
    expect(prismaMock.budgetExpense.delete).not.toHaveBeenCalled();
  });

  it('deletes an owned expense', async () => {
    prismaMock.budgetExpense.findFirst.mockResolvedValue(ownedExpense as never);
    expect((await DELETE(jsonRequest(URL, 'DELETE'), params('e1'))).status).toBe(204);
    expect(prismaMock.budgetExpense.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
  });
});
