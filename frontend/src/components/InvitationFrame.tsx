// Decorative frame layered on top of the invitation card. Replaces the
// previous generic WaxPattern with a considered designer treatment:
//
// - Celebration: double gold line inner frame + four art-deco corner
//   ornaments + a soft radial glow from the top. Reads as a premium
//   wedding / event invitation.
// - Mourning: a single thin frame + four small diamond markers at the
//   corners, no glow, no pattern. Reads as a classic faire-part.
//
// Pure decoration — pointer-events disabled, z-index kept low enough to
// sit between the card background and its content. All colors pull from
// the palette CSS vars injected on the card wrapper by paletteStyle(),
// so the frame recolors automatically when the organizer switches
// palettes.

import type { PaletteTone } from '@/lib/invitation-palettes';

interface InvitationFrameProps {
  tone: PaletteTone;
}

export function InvitationFrame({ tone }: InvitationFrameProps) {
  if (tone === 'mourning') {
    return (
      <>
        {/* Single thin inner border — the only decoration. */}
        <div
          className="pointer-events-none absolute inset-3 md:inset-4 rounded-xl"
          style={{
            border: '1px solid color-mix(in srgb, var(--inv-gold) 35%, transparent)',
          }}
          aria-hidden
        />
        {/* Four small diamonds at corners — classic mourning marker. */}
        {[
          'top-5 left-5 md:top-6 md:left-6',
          'top-5 right-5 md:top-6 md:right-6',
          'bottom-5 left-5 md:bottom-6 md:left-6',
          'bottom-5 right-5 md:bottom-6 md:right-6',
        ].map((pos, i) => (
          <span
            key={i}
            className={`pointer-events-none absolute ${pos} text-[10px]`}
            style={{ color: 'var(--inv-gold)', opacity: 0.6 }}
            aria-hidden
          >
            ◆
          </span>
        ))}
      </>
    );
  }

  // Celebration tone — richer treatment.
  return (
    <>
      {/* Soft radial glow at the top so the title area reads as 'lit'. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in srgb, var(--inv-gold) 10%, transparent) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      {/* Double-line inner frame — outer at 25%, inner thinner at 15%. */}
      <div
        className="pointer-events-none absolute inset-3 md:inset-4 rounded-xl"
        style={{
          border: '1px solid color-mix(in srgb, var(--inv-gold) 30%, transparent)',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-5 md:inset-6 rounded-lg"
        style={{
          border: '1px solid color-mix(in srgb, var(--inv-gold) 18%, transparent)',
        }}
        aria-hidden
      />
      {/* Four art-deco corner ornaments. Unicode ornament glyph ❖ is
          already elegant; set in the palette gold at 55% opacity. */}
      {[
        'top-4 left-4 md:top-5 md:left-5',
        'top-4 right-4 md:top-5 md:right-5',
        'bottom-4 left-4 md:bottom-5 md:left-5',
        'bottom-4 right-4 md:bottom-5 md:right-5',
      ].map((pos, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute ${pos} text-base md:text-lg leading-none`}
          style={{ color: 'var(--inv-gold)', opacity: 0.55 }}
          aria-hidden
        >
          ❖
        </span>
      ))}
    </>
  );
}
