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

const URL = 'http://test/api/budget/categories';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  vi.mocked(requireTier).mockResolvedValue(null);
});

describe('POST /api/budget/categories', () => {
  it('rejects a missing CSRF token', async () => {
    const res = await POST(
      jsonRequest(URL, 'POST', { ceremonyId: 'cer1', label: 'Dot' }, { csrf: false }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    const res = await POST(jsonRequest(URL, 'POST', { ceremonyId: 'cer1', label: 'Dot' }));
    expect(res.status).toBe(403);
    expect(prismaMock.budgetCategory.create).not.toHaveBeenCalled();
  });

  it('rejects 3 decimals on planned', async () => {
    const res = await POST(
      jsonRequest(URL, 'POST', { ceremonyId: 'cer1', label: 'Dot', planned: 1.234 }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('VALIDATION_FAILED');
  });

  it('rejects an empty label', async () => {
    const res = await POST(jsonRequest(URL, 'POST', { ceremonyId: 'cer1', label: '   ' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 for a foreign ceremony', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue(null);
    const res = await POST(jsonRequest(URL, 'POST', { ceremonyId: 'other', label: 'Dot' }));
    expect(res.status).toBe(404);
    expect(prismaMock.budgetCategory.create).not.toHaveBeenCalled();
  });

  it('creates the category after the last one', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue({ id: 'cer1' } as never);
    prismaMock.budgetCategory.aggregate.mockResolvedValue({ _max: { order: 5 } } as never);
    prismaMock.budgetCategory.create.mockResolvedValue({
      id: 'c9',
      label: 'Dot',
      planned: new Prisma.Decimal(250000),
      order: 6,
    } as never);

    const res = await POST(
      jsonRequest(URL, 'POST', { ceremonyId: 'cer1', label: ' Dot ', planned: 250000 }),
    );
    expect(res.status).toBe(201);
    expect((await res.json()).category).toEqual({
      id: 'c9',
      label: 'Dot',
      planned: '250000.00',
      order: 6,
    });
    const data = prismaMock.budgetCategory.create.mock.calls[0]?.[0]?.data as {
      label: string;
      order: number;
      ceremonyId: string;
    };
    expect(data).toMatchObject({ label: 'Dot', order: 6, ceremonyId: 'cer1' });
  });
});
