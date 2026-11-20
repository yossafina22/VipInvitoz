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

const URL = 'http://test/api/budget/categories/c1';
const owned = {
  id: 'c1',
  ceremonyId: 'cer1',
  label: 'Traiteur',
  planned: new Prisma.Decimal(0),
  order: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  vi.mocked(requireTier).mockResolvedValue(null);
});

describe('PATCH /api/budget/categories/[id]', () => {
  it('returns 404 for a category that is not the caller', async () => {
    prismaMock.budgetCategory.findFirst.mockResolvedValue(null);
    const res = await PATCH(jsonRequest(URL, 'PATCH', { label: 'X' }), params('c1'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('CATEGORY_NOT_FOUND');
    expect(prismaMock.budgetCategory.findFirst).toHaveBeenCalledWith({
      where: { id: 'c1', ceremony: { userId: 'u1' } },
    });
    expect(prismaMock.budgetCategory.update).not.toHaveBeenCalled();
  });

  it('renames and sets the planned amount', async () => {
    prismaMock.budgetCategory.findFirst.mockResolvedValue(owned as never);
    prismaMock.budgetCategory.update.mockResolvedValue({
      ...owned,
      label: 'Repas',
      planned: new Prisma.Decimal('800000.50'),
    } as never);
    const res = await PATCH(
      jsonRequest(URL, 'PATCH', { label: 'Repas', planned: 800000.5 }),
      params('c1'),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).category).toMatchObject({ label: 'Repas', planned: '800000.50' });
  });

  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    const res = await PATCH(jsonRequest(URL, 'PATCH', { label: 'X' }), params('c1'));
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/budget/categories/[id]', () => {
  it('refuses to delete a category that still has expenses', async () => {
    prismaMock.budgetCategory.findFirst.mockResolvedValue(owned as never);
    prismaMock.budgetExpense.count.mockResolvedValue(2);
    const res = await DELETE(jsonRequest(URL, 'DELETE'), params('c1'));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('CATEGORY_NOT_EMPTY');
    expect(prismaMock.budgetCategory.delete).not.toHaveBeenCalled();
  });

  it('deletes an empty category', async () => {
    prismaMock.budgetCategory.findFirst.mockResolvedValue(owned as never);
    prismaMock.budgetExpense.count.mockResolvedValue(0);
    const res = await DELETE(jsonRequest(URL, 'DELETE'), params('c1'));
    expect(res.status).toBe(204);
    expect(prismaMock.budgetCategory.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    const res = await DELETE(jsonRequest(URL, 'DELETE'), params('c1'));
    expect(res.status).toBe(403);
  });
});
