// VipInvitoz subscription helpers.
//
// Tier matrix (locked from the PRD + user decisions):
//
//   FREEMIUM : 1 ceremony max, 6 AI credits, 20 guests/ceremony, basics only.
//   PREMIUM  : ∞ ceremonies, 12 AI credits + chatbot, ∞ guests, tableplan,
//              projection live, guestbook.
//   VIP      : ∞ ceremonies, ∞ AI credits + chatbot, ∞ guests, + budget,
//              vendors, orientation.
//
// Subscription is a 1:1 row per user, auto-provisioned on first access
// (no separate onboarding step in V1). Renewal is manual trimestriel —
// no auto-renew (PRD §8 — out of scope V1).

import 'server-only';
import type { PrismaClient, Subscription } from '@prisma/client';

export type Tier = 'FREEMIUM' | 'PREMIUM' | 'VIP';

export interface TierSpec {
  tier: Tier;
  /** -1 = unlimited. */
  maxCeremonies: number;
  /** -1 = unlimited. Initial pool, reset at each renewal. */
  initialAiCredits: number;
  /** -1 = unlimited. Hard cap enforced at Guest.create time. */
  maxGuestsPerCeremony: number;
  /** Chatbot IA access (long interactive sessions). Premium + VIP only. */
  chatbotEnabled: boolean;
}

export const TIER_SPECS: Record<Tier, TierSpec> = {
  FREEMIUM: {
    tier: 'FREEMIUM',
    maxCeremonies: 1,
    initialAiCredits: 6,
    maxGuestsPerCeremony: 20,
    chatbotEnabled: false,
  },
  PREMIUM: {
    tier: 'PREMIUM',
    maxCeremonies: -1,
    initialAiCredits: 12,
    maxGuestsPerCeremony: -1,
    chatbotEnabled: true,
  },
  VIP: {
    tier: 'VIP',
    maxCeremonies: -1,
    initialAiCredits: -1,
    maxGuestsPerCeremony: -1,
    chatbotEnabled: true,
  },
};

export function getTierSpec(tier: string): TierSpec {
  return TIER_SPECS[tier as Tier] ?? TIER_SPECS.FREEMIUM;
}

/**
 * Return the user's Subscription row, creating a FREEMIUM one if absent.
 * Idempotent — safe to call on every request.
 */
export async function ensureActiveSubscription(
  prisma: PrismaClient,
  userId: string,
): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing;

  const spec = TIER_SPECS.FREEMIUM;
  return prisma.subscription.create({
    data: {
      userId,
      tier: spec.tier,
      status: 'ACTIVE',
      aiCreditsRemaining: spec.initialAiCredits,
      maxCeremonies: spec.maxCeremonies,
      expiresAt: null,
    },
  });
}

/**
 * Decrement the AI credits atomically. Returns the updated row, or null if
 * the user has no credits left (quota exceeded).
 *
 * Unlimited credits (VIP) are represented by aiCreditsRemaining = -1 and
 * never decremented — this helper short-circuits in that case.
 */
export async function consumeAiCredit(
  prisma: PrismaClient,
  userId: string,
): Promise<Subscription | null> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return null;
  if (sub.aiCreditsRemaining === -1) return sub;
  if (sub.aiCreditsRemaining <= 0) return null;

  return prisma.subscription.update({
    where: { userId },
    data: { aiCreditsRemaining: { decrement: 1 } },
  });
}
