import { prismaMock } from '@/test-utils/prisma-mock';
import { mockNextCookies } from '@/test-utils/mock-cookies';
import { jsonRequest } from '@/test-utils/json-request';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

mockNextCookies();
vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/tier-guard', () => ({ requireTier: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/vendors', async (orig) => ({
  ...(await orig<typeof import('@/lib/server/vipinvitoz/vendors')>()),
  createVendor: vi.fn(),
}));

import { requireAuth } from '@/lib/server/middleware';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import { createVendor } from '@/lib/server/vipinvitoz/vendors';
import { GET, POST } from './route';

const URL = 'http://test/api/vendors';
const vendorRow = {
  id: 'v1',
  ceremonyId: 'cer1',
  presetKey: 'catering',
  name: 'Chez Mama Fatou',
  imageUrl: null,
  phone: '+221771234567',
  amount: new Prisma.Decimal(820000),
  paid: false,
};
const valid = {
  ceremonyId: 'cer1',
  presetKey: 'catering',
  name: 'Chez Mama Fatou',
  amount: 820000,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  vi.mocked(requireTier).mockResolvedValue(null);
});

describe('GET /api/vendors', () => {
  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    expect((await GET(new NextRequest(URL))).status).toBe(403);
  });

  it('returns 404 for a foreign ceremony', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue(null);
    expect((await GET(new NextRequest(`${URL}?ceremonyId=other`))).status).toBe(404);
  });

  it('lists vendors with amounts as strings and the total', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue({ id: 'cer1' } as never);
    prismaMock.vendor.findMany.mockResolvedValue([
      vendorRow,
      { ...vendorRow, id: 'v2', amount: new Prisma.Decimal('150000.50'), paid: true },
    ] as never);
    const body = await (await GET(new NextRequest(URL))).json();
    expect(body.ceremonyId).toBe('cer1');
    expect(body.vendors[0]).toMatchObject({
      id: 'v1',
      amount: '820000.00',
      phone: '+221771234567',
    });
    expect(body.total).toBe('970000.50');
    expect(body.paidTotal).toBe('150000.50');
  });
});

describe('POST /api/vendors', () => {
  it('rejects a local phone number without international prefix', async () => {
    const res = await POST(jsonRequest(URL, 'POST', { ...valid, phone: '77 123 45 67' }));
    expect(res.status).toBe(400);
    expect(createVendor).not.toHaveBeenCalled();
  });

  it('rejects an image that is not a Cloudinary upload', async () => {
    const res = await POST(
      jsonRequest(URL, 'POST', { ...valid, imageUrl: 'https://evil.example/x.jpg' }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects an unknown preset', async () => {
    const res = await POST(jsonRequest(URL, 'POST', { ...valid, presetKey: 'astronaut' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 for a foreign ceremony', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue(null);
    expect((await POST(jsonRequest(URL, 'POST', valid))).status).toBe(404);
    expect(createVendor).not.toHaveBeenCalled();
  });

  it('creates the vendor with a normalized phone in the request locale', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue({ id: 'cer1' } as never);
    vi.mocked(createVendor).mockResolvedValue(vendorRow as never);
    const res = await POST(
      jsonRequest(`${URL}?locale=en`, 'POST', { ...valid, phone: '00221 77 123 45 67' }),
    );
    expect(res.status).toBe(201);
    expect(vi.mocked(createVendor).mock.calls[0]?.[1]).toMatchObject({
      ceremonyId: 'cer1',
      locale: 'en',
      presetKey: 'catering',
      phone: '+221771234567',
      paid: false,
      imageUrl: null,
    });
  });

  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    expect((await POST(jsonRequest(URL, 'POST', valid))).status).toBe(403);
  });
});
