// VIP-15 — Share an invitation via WhatsApp / email / link.
//
// Stays in lib/server/ so routes + cron workers can reuse it. The
// invitation row is updated atomically here (channel + sentAt).
//
// Email sending is enqueued on the EmailQueue singleton; it may be a no-op
// in dev (console mailer) or absent (missing env). See email-queue-singleton.ts.

import 'server-only';
import type { Invitation, PrismaClient } from '@prisma/client';
import { getEmailQueue } from '@/lib/server/queues/email-queue-singleton';

export type ShareChannel = 'EMAIL' | 'WHATSAPP' | 'LINK';

export interface ShareContext {
  guest: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  invitation: Invitation;
  ceremony: { title: string };
  publicUrl: string;
}

/**
 * Normalize a phone number to a wa.me-compatible string (digits only, no
 * leading zero, no "+"). Returns null for an empty/clearly-invalid input.
 */
export function waNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  // Minimum sanity check — Senegal / most Africa E.164 have at least 9 digits.
  if (digits.length < 7) return null;
  return digits.replace(/^0+/, '');
}

/**
 * Compose the WhatsApp message body. The link is already absolute (client
 * supplies the origin). Caller should URL-encode when building the final
 * wa.me URL.
 */
export function waMessageBody(ctx: ShareContext): string {
  return (
    `Bonjour ${ctx.guest.name}, ` +
    `vous êtes convié(e) à "${ctx.ceremony.title}". ` +
    `Voici votre invitation personnelle : ${ctx.publicUrl}`
  );
}

export function waUrl(ctx: ShareContext): string | null {
  const num = waNumber(ctx.guest.phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(waMessageBody(ctx))}`;
}

/** Minimal HTML invitation email. Keeps inline styles — stays readable even
 *  if the recipient strips CSS. */
export function emailTemplate(ctx: ShareContext): { subject: string; html: string; text: string } {
  const subject = `Vous êtes invité(e) à ${ctx.ceremony.title}`;
  const safeTitle = ctx.ceremony.title.replace(/</g, '&lt;');
  const safeName = ctx.guest.name.replace(/</g, '&lt;');

  const html = `<!doctype html>
<html lang="fr"><body style="margin:0;padding:0;background:#f6f3ee;font-family:Georgia,serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;">
        <tr><td align="center">
          <div style="font-size:32px;margin-bottom:8px;">💌</div>
          <h1 style="font-size:22px;margin:0 0 4px;">Vous êtes invité(e)</h1>
          <p style="margin:0 0 24px;color:#6b6257;">${safeName},</p>
          <h2 style="font-size:18px;font-weight:600;margin:0 0 20px;color:#8b6f3f;">${safeTitle}</h2>
          <p style="margin:0 0 24px;line-height:1.6;">
            C'est avec joie que nous vous convions. Ouvrez votre invitation personnelle pour
            voir la date, le lieu et répondre à votre RSVP.
          </p>
          <a href="${ctx.publicUrl}" style="display:inline-block;background:#8b6f3f;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;">
            Voir mon invitation
          </a>
          <p style="margin:28px 0 0;font-size:12px;color:#9c948a;">
            Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
            <span style="word-break:break-all;">${ctx.publicUrl}</span>
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#9c948a;">VipInvitoz</p>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `${safeName},\n\n` +
    `Vous êtes invité(e) à ${safeTitle}.\n\n` +
    `Ouvrez votre invitation personnelle : ${ctx.publicUrl}\n\n` +
    `— VipInvitoz`;

  return { subject, html, text };
}

export interface SendShareResult {
  channel: ShareChannel;
  invitation: Invitation;
  /** Present when channel === "WHATSAPP": a wa.me deep link the client opens. */
  waUrl?: string;
  /** Present when channel === "EMAIL" and the queue is configured. */
  emailJobId?: string;
  /** Present when channel === "EMAIL" and the queue is NOT configured. */
  emailQueueMissing?: true;
}

/**
 * Mark the invitation as sent on `channel` (sets channel + sentAt=now),
 * and for EMAIL enqueue a Resend email. Never throws for a missing phone
 * (returns a plain "channel" update without waUrl) — the client decides
 * what to show.
 */
export async function sendInvitationOnChannel(
  prisma: PrismaClient,
  ctx: ShareContext,
  channel: ShareChannel,
): Promise<SendShareResult> {
  const updated = await prisma.invitation.update({
    where: { id: ctx.invitation.id },
    data: {
      channel,
      sentAt: ctx.invitation.sentAt ?? new Date(),
    },
  });

  if (channel === 'WHATSAPP') {
    const url = waUrl({ ...ctx, invitation: updated });
    return url ? { channel, invitation: updated, waUrl: url } : { channel, invitation: updated };
  }

  if (channel === 'EMAIL') {
    if (!ctx.guest.email) {
      return { channel, invitation: updated };
    }
    const queue = getEmailQueue();
    if (!queue) {
      return { channel, invitation: updated, emailQueueMissing: true };
    }
    const { subject, html, text } = emailTemplate({ ...ctx, invitation: updated });
    const jobId = await queue.enqueue({
      to: ctx.guest.email,
      subject,
      html,
      text,
    });
    return { channel, invitation: updated, emailJobId: jobId };
  }

  return { channel, invitation: updated };
}
