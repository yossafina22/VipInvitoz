// Vendor contact helpers shared by server (validation) and client (links).

import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Returns E.164 or null. An international prefix is required — wa.me cannot
// guess the country of a local number. libphonenumber applies each country's
// trunk-zero rule ("+33 06…" → +336…, while +225 07… keeps its 0).
export function normalizePhone(raw: string): string | null {
  const s = raw.trim().replace(/^00/, '+');
  if (!s.startsWith('+')) return null;
  const parsed = parsePhoneNumberFromString(s);
  return parsed?.isValid() ? parsed.number : null;
}

export function whatsappUrl(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, '')}`;
}

function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function toVCard(input: { name: string; phone: string; note?: string }): string {
  const name = escapeVCardText(input.name);
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `N:${name};;;;`,
    `TEL;TYPE=CELL:${input.phone}`,
  ];
  if (input.note) lines.push(`NOTE:${escapeVCardText(input.note)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}
