// VIP vendors — contact card.
//
// GET /api/vendors/[id]/vcard?locale=fr|en → text/vcard, served inline so iOS
// Safari shows its "Create contact" sheet and Android opens Contacts (a blob
// download only lands in Files, and in-app browsers ignore it).
// auth + VIP. Vendor not owned by the caller → 404; no phone → 404 VENDOR_NO_PHONE.

export const runtime = 'nodejs';

import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/middleware';
import { makeRequestContext, withRequestContext } from '@/lib/server/observability/request-context';
import { prisma } from '@/lib/server/prisma';
import { requireTier } from '@/lib/server/vipinvitoz/tier-guard';
import { toBudgetLocale } from '@/lib/server/vipinvitoz/budget';
import { findOwnedVendor } from '@/lib/server/vipinvitoz/vendors';
import { toVCard } from '@/lib/vendors/contact';
import { isVendorPresetKey } from '@/lib/vendors/presets';
import fr from '../../../../../../messages/fr.json';
import en from '../../../../../../messages/en.json';

const PRESET_LABELS: Record<'fr' | 'en', Record<string, string>> = {
  fr: fr.vendors.presets,
  en: en.vendors.presets,
};

function contentDisposition(name: string): string {
  const file = `${name}.vcf`;
  const ascii = file.replace(/[^A-Za-z0-9 ._-]/g, '_');
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file)}`;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const reqCtx = makeRequestContext(req.headers);
  return withRequestContext(reqCtx, async () => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const denied = await requireTier(prisma, auth.user.sub, 'VIP');
    if (denied) return denied;
    const { id } = await ctx.params;

    const vendor = await findOwnedVendor(prisma, auth.user.sub, id);
    if (!vendor) return NextResponse.json({ error: 'VENDOR_NOT_FOUND' }, { status: 404 });
    if (!vendor.phone) return NextResponse.json({ error: 'VENDOR_NO_PHONE' }, { status: 404 });

    const locale = toBudgetLocale(new URL(req.url).searchParams.get('locale'));
    const note =
      vendor.presetKey && isVendorPresetKey(vendor.presetKey)
        ? PRESET_LABELS[locale][vendor.presetKey]
        : undefined;
    const card = toVCard({ name: vendor.name, phone: vendor.phone, ...(note ? { note } : {}) });

    return new NextResponse(`${card}\r\n`, {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': contentDisposition(vendor.name),
        'Cache-Control': 'private, no-store',
      },
    });
  });
}
