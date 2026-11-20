// Vendor contact helpers shared by server (validation) and client (links).

// E.164: '+' then 8–15 digits, first digit non-zero. An international prefix
// is required — wa.me cannot guess the country of a local number.
export function normalizePhone(raw: string): string | null {
  let s = raw.trim().replace(/\(0\)/g, '');
  s = s.replace(/[\s.()-]/g, '');
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
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
