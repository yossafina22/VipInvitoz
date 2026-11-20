// Server-side tier gate for paid features. The SideBar PRO/VIP badges are
// cosmetic; this is what actually refuses a lower tier.

import 'server-only';
import { NextResponse } from 'next/server';
import type { PrismaClient, Subscription } from '@prisma/client';
import { ensureActiveSubscription, type Tier } from './subscription';

const TIER_RANK: Record<Tier, number> = { FREEMIUM: 0, PREMIUM: 1, VIP: 2 };

function isTier(value: string): value is Tier {
  return value in TIER_RANK;
}

export function effectiveTier(
  sub: Pick<Subscription, 'tier' | 'status' | 'expiresAt'>,
  now: Date = new Date(),
): Tier {
  if (!isTier(sub.tier) || sub.tier === 'FREEMIUM') return 'FREEMIUM';
  if (sub.status !== 'ACTIVE') return 'FREEMIUM';
  if (sub.expiresAt && sub.expiresAt.getTime() <= now.getTime()) return 'FREEMIUM';
  return sub.tier;
}

export async function requireTier(
  prisma: PrismaClient,
  userId: string,
  min: Tier,
): Promise<NextResponse | null> {
  const sub = await ensureActiveSubscription(prisma, userId);
  if (TIER_RANK[effectiveTier(sub)] >= TIER_RANK[min]) return null;
  return NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: min }, { status: 403 });
}
