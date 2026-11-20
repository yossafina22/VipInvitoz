import { prismaMock } from '@/test-utils/prisma-mock';
import { describe, it, expect } from 'vitest';
import { effectiveTier, requireTier } from './tier-guard';

const now = new Date('2026-11-20T12:00:00Z');
const future = new Date('2027-01-01T00:00:00Z');
const past = new Date('2026-10-01T00:00:00Z');

function sub(tier: string, status = 'ACTIVE', expiresAt: Date | null = future) {
  return {
    id: 's1',
    userId: 'u1',
    tier,
    status,
    startedAt: past,
    expiresAt,
    aiCreditsRemaining: 0,
    maxCeremonies: 1,
    orderId: null,
    createdAt: past,
    updatedAt: past,
  };
}

describe('effectiveTier', () => {
  it('returns VIP for an active, unexpired VIP subscription', () => {
    expect(effectiveTier({ tier: 'VIP', status: 'ACTIVE', expiresAt: future }, now)).toBe('VIP');
  });

  it('downgrades a VIP whose expiresAt is in the past to FREEMIUM', () => {
    expect(effectiveTier({ tier: 'VIP', status: 'ACTIVE', expiresAt: past }, now)).toBe('FREEMIUM');
  });

  it('downgrades an EXPIRED-status VIP to FREEMIUM', () => {
    expect(effectiveTier({ tier: 'VIP', status: 'EXPIRED', expiresAt: future }, now)).toBe(
      'FREEMIUM',
    );
  });

  it('keeps FREEMIUM with no expiry', () => {
    expect(effectiveTier({ tier: 'FREEMIUM', status: 'ACTIVE', expiresAt: null }, now)).toBe(
      'FREEMIUM',
    );
  });

  it('treats an unknown tier string as FREEMIUM', () => {
    expect(effectiveTier({ tier: 'GOLD', status: 'ACTIVE', expiresAt: future }, now)).toBe(
      'FREEMIUM',
    );
  });
});

describe('requireTier', () => {
  it('returns a 403 TIER_REQUIRED response when PREMIUM asks for VIP', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(sub('PREMIUM') as never);
    const res = await requireTier(prismaMock as never, 'u1', 'VIP');
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    expect(await res!.json()).toEqual({ error: 'TIER_REQUIRED', requiredTier: 'VIP' });
  });

  it('returns null when VIP asks for PREMIUM', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(sub('VIP') as never);
    expect(await requireTier(prismaMock as never, 'u1', 'PREMIUM')).toBeNull();
  });
});
