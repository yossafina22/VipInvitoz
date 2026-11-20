import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { params } from '@/test-utils/json-request';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/tier-guard', () => ({ requireTier: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import { GET } from './route';

const URL = 'http://test/api/vendors/v1/vcard';
const owned = {
  id: 'v1',
  ceremonyId: 'cer1',
  presetKey: 'catering',
  name: 'Chez Mama Fatou',
  imageUrl: null,
  phone: '+221771234567',
  amount: new Prisma.Decimal(100),
  paid: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  vi.mocked(requireTier).mockResolvedValue(null);
});

describe('GET /api/vendors/[id]/vcard', () => {
  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    expect((await GET(new NextRequest(URL), params('v1'))).status).toBe(403);
  });

  it('returns 404 for a vendor that is not the caller', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(null);
    const res = await GET(new NextRequest(URL), params('v1'));
    expect(res.status).toBe(404);
    expect(prismaMock.vendor.findFirst).toHaveBeenCalledWith({
      where: { id: 'v1', ceremony: { userId: 'u1' } },
    });
  });

  it('returns 404 when the vendor has no phone number', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue({ ...owned, phone: null } as never);
    const res = await GET(new NextRequest(URL), params('v1'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('VENDOR_NO_PHONE');
  });

  it('serves an inline vCard the phone opens as a contact', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue(owned as never);
    const res = await GET(new NextRequest(`${URL}?locale=fr`), params('v1'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/vcard; charset=utf-8');
    expect(res.headers.get('content-disposition')).toBe(
      `inline; filename="Chez Mama Fatou.vcf"; filename*=UTF-8''Chez%20Mama%20Fatou.vcf`,
    );
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    const body = await res.text();
    expect(body).toContain('TEL;TYPE=CELL:+221771234567');
    expect(body).toContain('NOTE:Traiteur');
    expect(body.endsWith('END:VCARD\r\n')).toBe(true);
  });

  it('keeps the ASCII filename safe for accented or odd names', async () => {
    prismaMock.vendor.findFirst.mockResolvedValue({
      ...owned,
      presetKey: null,
      name: 'Pâtisserie "Awa"; Dakar',
    } as never);
    const res = await GET(new NextRequest(`${URL}?locale=en`), params('v1'));
    const disposition = res.headers.get('content-disposition') ?? '';
    expect(disposition).toMatch(/^inline; filename="P_tisserie _Awa__ Dakar\.vcf"; filename\*=/);
    expect(disposition).toContain(`filename*=UTF-8''P%C3%A2tisserie%20%22Awa%22%3B%20Dakar.vcf`);
    expect(await res.text()).not.toContain('NOTE:');
  });
});
