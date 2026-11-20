import { describe, it, expect } from 'vitest';
import { normalizePhone, toVCard, whatsappUrl } from './contact';

describe('normalizePhone', () => {
  it.each([
    ['+221 77 123 45 67', '+221771234567'],
    ['00221 77-123-45-67', '+221771234567'],
    ['+33 (0)6 12 34 56 78', '+33612345678'],
    ['+44 7911 123456', '+447911123456'],
    ['+221.77.123.45.67', '+221771234567'],
  ])('normalizes %s to %s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it.each(['77 123 45 67', '0612345678', '+0 123', 'abc', '+221', '+1234567890123456'])(
    'rejects %s (no international prefix or invalid length)',
    (raw) => {
      expect(normalizePhone(raw)).toBeNull();
    },
  );
});

describe('whatsappUrl', () => {
  it('uses the digits only, without +', () => {
    expect(whatsappUrl('+221771234567')).toBe('https://wa.me/221771234567');
  });
});

describe('toVCard', () => {
  it('builds a vCard 3.0 with name, cell phone and note', () => {
    const card = toVCard({ name: 'Chez Mama Fatou', phone: '+221771234567', note: 'Traiteur' });
    expect(card.split('\r\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Chez Mama Fatou',
      'N:Chez Mama Fatou;;;;',
      'TEL;TYPE=CELL:+221771234567',
      'NOTE:Traiteur',
      'END:VCARD',
    ]);
  });

  it('escapes commas, semicolons and backslashes in text fields', () => {
    const card = toVCard({ name: 'DJ; Papis, Band', phone: '+221771234567', note: 'a\\b' });
    expect(card).toContain('FN:DJ\\; Papis\\, Band');
    expect(card).toContain('NOTE:a\\\\b');
  });
});
