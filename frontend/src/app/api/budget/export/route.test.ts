import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/server/middleware', () => ({ requireAuth: vi.fn() }));
vi.mock('@/lib/server/vipinvitoz/tier-guard', () => ({ requireTier: vi.fn() }));

import { requireAuth } from '@/lib/server/middleware';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import { GET } from './route';

const D = (v: number | string) => new Prisma.Decimal(v);
const get = (qs: string) =>
  new NextRequest(`http://test/api/budget/export${qs}`, { method: 'GET' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAuth).mockResolvedValue({ user: { sub: 'u1', email: 'u1@x.test' } } as never);
  vi.mocked(requireTier).mockResolvedValue(null);
});

describe('GET /api/budget/export', () => {
  it('returns 403 for a non-VIP', async () => {
    vi.mocked(requireTier).mockResolvedValueOnce(
      NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: 'VIP' }, { status: 403 }),
    );
    expect((await GET(get('?ceremonyId=cer1'))).status).toBe(403);
  });

  it('returns 404 for a foreign ceremony', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue(null);
    expect((await GET(get('?ceremonyId=other'))).status).toBe(404);
  });

  it('returns a French CSV with BOM, header row and translated status', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue({ id: 'cer1' } as never);
    prismaMock.budgetExpense.findMany.mockResolvedValue([
      {
        id: 'e1',
        categoryId: 'c1',
        label: 'Chaises',
        quantity: D(200),
        unitAmount: D(500),
        status: 'PAID',
        date: new Date('2026-12-01T00:00:00Z'),
        category: { label: 'Salle & décor' },
      },
    ] as never);

    const res = await GET(get('?ceremonyId=cer1&locale=fr'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="budget.csv"');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    // TextDecoder strips the BOM by default, so the decoded text starts at the header.
    const lines = new TextDecoder().decode(bytes).split('\r\n');
    expect(lines[0]).toBe('Date;Poste;Libellé;Quantité;Prix unitaire;Total;Statut');
    expect(lines[1]).toBe('2026-12-01;Salle & décor;Chaises;200,00;500,00;100000,00;Payé');
  });

  it('uses English headers and statuses for locale=en', async () => {
    prismaMock.ceremony.findFirst.mockResolvedValue({ id: 'cer1' } as never);
    prismaMock.budgetExpense.findMany.mockResolvedValue([]);
    const text = await (await GET(get('?ceremonyId=cer1&locale=en'))).text();
    expect(text).toBe('Date,Category,Label,Quantity,Unit amount,Total,Status');
  });
});
