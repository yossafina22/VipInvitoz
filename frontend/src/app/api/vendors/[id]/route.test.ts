import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { jsonRequest, params } from '@/test-utils/json-request';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/tier-guard', () => ({ requireTier: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/vendors', async (orig) => ({
  ...(await orig<typeof import('@/lib/server/vipinvitoz/vendors')>()),
  updateVendor: vi.fn(),
}));

import { requireAuth } from '@/lib/server/middleware';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import { updateVendor } from '@/lib/server/vipinvitoz/vendors';
import { DELETE, PATCH } from './route';

const URL = 'http://test/api/vendors/v1';
const owned = {
  id: 'v1',
  ceremonyId: 'cer1',
  presetKey: null,
  name: 'Sécurité',
  imageUrl: null,
  phone: null,
  amount: new Prisma.Decimal(100),
  paid: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  vi.mocked(requireTier).mockResolvedValue(null);
});

describe('PATCH /api/vendors/[id]', () => {
  it('returns 404 for a vendor that is not the caller', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(null);
    const res = await PATCH(jsonRequest(URL, 'PATCH', { paid: true }), params('v1'));
    expect(res.status).toBe(404);
    expect(prismaMock.vendor.findFirst).toHaveBeenCalledWith({
      where: { id: 'v1', ceremony: { userId: 'u1' } },
    });
    expect(updateVendor).not.toHaveBeenCalled();
  });

  it('updates paid and clears the phone', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(owned as never);
    vi.mocked(updateVendor).mockResolvedValue({ ...owned, paid: true } as never);
    const res = await PATCH(jsonRequest(URL, 'PATCH', { paid: true, phone: null }), params('v1'));
    expect(res.status).toBe(200);
    expect(vi.mocked(updateVendor).mock.calls[0]?.[2]).toEqual({ paid: true, phone: null });
    expect((await res.json()).vendor.paid).toBe(true);
  });

  it('rejects an invalid amount', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(owned as never);
    const res = await PATCH(jsonRequest(URL, 'PATCH', { amount: -5 }), params('v1'));
    expect(res.status).toBe(400);
  });

  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    expect((await PATCH(jsonRequest(URL, 'PATCH', { paid: true }), params('v1'))).status).toBe(403);
  });

  it("returns 404 when the new category is not in the vendor's ceremony", async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(owned as never);
    prismaMock.budgetCategory.findFirst.mockResolvedValue(null);
    const res = await PATCH(jsonRequest(URL, 'PATCH', { categoryId: 'foreign' }), params('v1'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('CATEGORY_NOT_FOUND');
    expect(prismaMock.budgetCategory.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign', ceremonyId: 'cer1' },
      select: { id: true },
    });
    expect(updateVendor).not.toHaveBeenCalled();
  });

  it('moves the vendor to another budget category', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(owned as never);
    prismaMock.budgetCategory.findFirst.mockResolvedValue({ id: 'cat-dj' } as never);
    vi.mocked(updateVendor).mockResolvedValue(owned as never);
    const res = await PATCH(jsonRequest(URL, 'PATCH', { categoryId: 'cat-dj' }), params('v1'));
    expect(res.status).toBe(200);
    expect(vi.mocked(updateVendor).mock.calls[0]?.[2]).toEqual({ categoryId: 'cat-dj' });
  });
});

describe('DELETE /api/vendors/[id]', () => {
  it('returns 404 for a vendor that is not the caller', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(null);
    expect((await DELETE(jsonRequest(URL, 'DELETE'), params('v1'))).status).toBe(404);
    expect(prismaMock.vendor.delete).not.toHaveBeenCalled();
  });

  it('deletes the vendor (its budget expense cascades)', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(owned as never);
    const res = await DELETE(jsonRequest(URL, 'DELETE'), params('v1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(prismaMock.vendor.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
  });
});
