// VIP-17 — Initial AI invitation generation.
//
// POST /api/ceremonies/[id]/ai-generate
//   Organizer-only (verifyCsrf + requireAuth + ownership).
//   Body: { locale?: 'fr' | 'en' | 'de' } — defaults to 'fr'.
//
// Flow:
//   1. Ownership check (404 if cross-user)
//   2. consumeAiCredit → 403 AI_QUOTA_EXCEEDED if none left
//   3. generateInitialInvitation (Claude Sonnet 5.5)
//   4. Persist to ceremony.invitationJson + append an AiGeneration audit row
//   5. Return { ceremony, aiCreditsRemaining, aiGenerationId }
//
// If ANTHROPIC_API_KEY is missing → 503 AI_NOT_CONFIGURED. The credit is
// NOT consumed in that case (the caller never got a result).

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { log } from '@/lib/server/observability/log';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import {
  ClaudeUnconfiguredError,
  generateInitialInvitation,
  type CeremonyType,
  type SupportedLocale,
} from '@/lib/server/ai/claude';
import { consumeAiCredit } from '@/lib/server/vipinvitoz/subscription';

const Body = z
  .object({
    locale: z.enum(['fr', 'en', 'de']).optional(),
  })
  .optional();

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const csrf = verifyCsrf(req);
    if (csrf) return csrf;

    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const userId = auth.user.sub;

    const { id } = await ctx.params;

    // Parse body — tolerates empty body.
    let json: unknown = undefined;
    try {
      const text = await req.text();
      if (text) json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: 'Corps JSON invalide.' },
        { status: 400 },
      );
    }
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Paramètres invalides.',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }
    const locale: SupportedLocale = parsed.data?.locale ?? 'fr';

    const ceremony = await prisma.ceremony.findFirst({
      where: { id, userId },
      include: { occasions: { orderBy: { order: 'asc' } } },
    });
    if (!ceremony) {
      return NextResponse.json(
        { error: 'CEREMONY_NOT_FOUND', message: 'Cérémonie introuvable.' },
        { status: 404 },
      );
    }
    if (ceremony.occasions.length === 0) {
      return NextResponse.json(
        {
          error: 'CEREMONY_NO_OCCASIONS',
          message: 'Ajoutez au moins une occasion avant de générer l’invitation.',
        },
        { status: 400 },
      );
    }

    // Debit the credit BEFORE calling Claude so two concurrent clicks don't
    // both spend. On an upstream-attributable error (auth, quota, network
    // from our side) we refund — these are NOT user attempts. User-facing
    // Claude failures (malformed JSON, content policy) still consume the
    // credit per the "pay for the attempt" PRD rule.
    const sub = await consumeAiCredit(prisma, userId);
    if (!sub) {
      return NextResponse.json(
        {
          error: 'AI_QUOTA_EXCEEDED',
          message:
            'Crédits IA épuisés pour ce trimestre. Passez en VIP ou attendez le renouvellement.',
        },
        { status: 403 },
      );
    }

    async function refundCredit(): Promise<number> {
      try {
        const refunded = await prisma.subscription.update({
          where: { userId },
          data: { aiCreditsRemaining: { increment: 1 } },
          select: { aiCreditsRemaining: true },
        });
        return refunded.aiCreditsRemaining;
      } catch {
        return sub!.aiCreditsRemaining;
      }
    }

    let result;
    try {
      result = await generateInitialInvitation({
        ceremonyType: ceremony.type as CeremonyType,
        locale,
        title: ceremony.title,
        description: ceremony.description,
        occasions: ceremony.occasions.map((o) => ({
          label: o.label,
          startsAt: o.startsAt,
          locationName: o.locationName,
          locationAddress: o.locationAddress,
        })),
      });
    } catch (err) {
      if (err instanceof ClaudeUnconfiguredError) {
        const remaining = await refundCredit();
        log.warn('ai-generate: Claude not configured (credit refunded)');
        return NextResponse.json(
          {
            error: 'AI_NOT_CONFIGURED',
            message:
              'La génération IA n’est pas configurée côté serveur (ANTHROPIC_API_KEY manquant).',
            aiCreditsRemaining: remaining,
          },
          { status: 503 },
        );
      }
      const errMsg = err instanceof Error ? err.message : String(err);
      // Anthropic auth / rate-limit / server errors are NOT user-attributable
      // — refund the credit so the user isn't drained by misconfiguration.
      const isUpstreamAuth = /\b401\b|invalid x-api-key|authentication_error/i.test(errMsg);
      const isUpstreamRate = /\b429\b|rate_?limit/i.test(errMsg);
      const isUpstreamServer = /\b5\d\d\b|overloaded|server_error/i.test(errMsg);
      if (isUpstreamAuth || isUpstreamRate || isUpstreamServer) {
        const remaining = await refundCredit();
        log.error('ai-generate: upstream failure (credit refunded)', { err: errMsg });
        const code = isUpstreamAuth
          ? 'AI_PROVIDER_AUTH'
          : isUpstreamRate
            ? 'AI_PROVIDER_RATE_LIMITED'
            : 'AI_PROVIDER_UNAVAILABLE';
        const message = isUpstreamAuth
          ? 'La clé API Anthropic est invalide. Contactez l’administrateur.'
          : isUpstreamRate
            ? 'Trop de requêtes IA — réessayez dans quelques instants.'
            : 'Le service IA est momentanément indisponible. Réessayez plus tard.';
        return NextResponse.json(
          { error: code, message, aiCreditsRemaining: remaining },
          { status: 502 },
        );
      }
      log.error('ai-generate: Claude call failed (credit consumed)', { err: errMsg });
      return NextResponse.json(
        {
          error: 'AI_CALL_FAILED',
          message: 'La génération a échoué. Réessayez dans quelques instants.',
        },
        { status: 502 },
      );
    }

    // Persist the result + audit row atomically. Reads Subscription back in
    // case a concurrent call changed it (defensive — single-row key is fast).
    const [updated, aiRow] = await prisma.$transaction(
      async (tx) => {
        const u = await tx.ceremony.update({
          where: { id: ceremony.id },
          data: {
            invitationJson: result.invitation as unknown as object,
          },
          include: {
            occasions: { orderBy: { order: 'asc' } },
            _count: { select: { guests: true, invitations: true } },
          },
        });
        const a = await tx.aiGeneration.create({
          data: {
            userId,
            ceremonyId: ceremony.id,
            kind: 'INITIAL',
            model: result.model,
            prompt: `[INITIAL ${ceremony.type} ${locale}]`,
            response: JSON.stringify(result.invitation),
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            costMicrocents: result.costMicrocents,
          },
        });
        return [u, a];
      },
      { maxWait: 10_000, timeout: 15_000 },
    );

    log.info('ai-generate ok', {
      ceremonyId: ceremony.id,
      aiGenerationId: aiRow.id,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costMicrocents: result.costMicrocents,
    });

    return NextResponse.json({
      ceremony: updated,
      aiCreditsRemaining: sub.aiCreditsRemaining,
      aiGenerationId: aiRow.id,
    });
  });
}
