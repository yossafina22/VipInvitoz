// Shared preamble for budget mutation routes: CSRF → auth → VIP tier, and
// JSON body parsing with the project's VALIDATION_FAILED error shape.

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import type { z } from 'zod';
import { verifyCsrf } from '@/lib/server/auth';
import { requireAuth } from '@/lib/server/middleware';
import { prisma } from '@/lib/server/prisma';
import { requireTier } from './tier-guard';

export async function guardBudgetMutation(
  req: NextRequest,
): Promise<{ userId: string } | NextResponse> {
  const csrf = verifyCsrf(req);
  if (csrf) return csrf;
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const denied = await requireTier(prisma, auth.user.sub, 'VIP');
  if (denied) return denied;
  return { userId: auth.user.sub };
}

export async function parseBody<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S,
): Promise<z.infer<S> | NextResponse> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'VALIDATION_FAILED', message: 'Corps JSON invalide.' },
      { status: 400 },
    );
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_FAILED', message: 'Données invalides.', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  return parsed.data;
}

export function notFound(error: 'CEREMONY_NOT_FOUND' | 'CATEGORY_NOT_FOUND' | 'EXPENSE_NOT_FOUND') {
  return NextResponse.json({ error }, { status: 404 });
}
