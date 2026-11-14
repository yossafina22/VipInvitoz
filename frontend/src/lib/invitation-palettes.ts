// VipInvitoz — Invitation palettes.
//
// A palette is a named bundle of colors applied to the invitation card
// (editor preview + /ceremonies/[id]/preview + public /i/[slug]). The organizer
// picks one in the editor; for DEUIL ceremonies we force 'noir-minimal' and
// disable the picker. New palettes get a new id + swatches without any DB
// migration — Ceremony.invitationPalette is a free-form string on purpose.
//
// The `vars` map is injected as inline CSS custom properties on the invitation
// wrapper element. The downstream Tailwind markup reads them via
// `style={{ backgroundColor: 'var(--inv-primary)' }}` style patterns, so a new
// palette only needs sensible hex values — no component edit required.

export type PaletteId =
  | 'sahel-or'
  | 'bordeaux-royal'
  | 'jade-imperial'
  | 'pastel-celeste'
  | 'noir-minimal';

export type PaletteTone = 'celebration' | 'mourning';

export interface InvitationPalette {
  id: PaletteId;
  name: string;
  tagline: string;
  tone: PaletteTone;
  /** Three visible swatches rendered in the picker, top-to-bottom. */
  swatches: readonly [string, string, string];
  /** CSS variables injected on the invitation wrapper. */
  vars: {
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    bg: string;
    surface: string;
    text: string;
    textMuted: string;
    goldAccent: string;
    patternOpacity: number;
  };
}

export const INVITATION_PALETTES: Record<PaletteId, InvitationPalette> = {
  'sahel-or': {
    id: 'sahel-or',
    name: 'Sahel Or',
    tagline: 'Chaleureux et traditionnel',
    tone: 'celebration',
    swatches: ['#C2410C', '#D4A017', '#FEF7E6'],
    vars: {
      primary: '#C2410C',
      primaryForeground: '#FFF7ED',
      accent: '#D4A017',
      accentForeground: '#1F2937',
      bg: '#FEF7E6',
      surface: '#FFFBEF',
      text: '#1F2937',
      textMuted: '#6B5B3A',
      goldAccent: '#D4A017',
      patternOpacity: 0.12,
    },
  },
  'bordeaux-royal': {
    id: 'bordeaux-royal',
    name: 'Bordeaux Royal',
    tagline: 'Formel et profond',
    tone: 'celebration',
    swatches: ['#7F1D1D', '#D4A017', '#FDF6E3'],
    vars: {
      primary: '#7F1D1D',
      primaryForeground: '#FDF6E3',
      accent: '#D4A017',
      accentForeground: '#1F2937',
      bg: '#FDF6E3',
      surface: '#FFFBEE',
      text: '#1F2937',
      textMuted: '#5B3A3A',
      goldAccent: '#B8860B',
      patternOpacity: 0.1,
    },
  },
  'jade-imperial': {
    id: 'jade-imperial',
    name: 'Jade Impérial',
    tagline: 'Élégant et vif',
    tone: 'celebration',
    swatches: ['#065F46', '#D4A017', '#F5F7F2'],
    vars: {
      primary: '#065F46',
      primaryForeground: '#F5F7F2',
      accent: '#D4A017',
      accentForeground: '#1F2937',
      bg: '#F5F7F2',
      surface: '#FBFDF9',
      text: '#1F2937',
      textMuted: '#3F5A4E',
      goldAccent: '#B8860B',
      patternOpacity: 0.1,
    },
  },
  'pastel-celeste': {
    id: 'pastel-celeste',
    name: 'Pastel Céleste',
    tagline: 'Doux et léger',
    tone: 'celebration',
    swatches: ['#FBCFE8', '#BAE6FD', '#FFF9F5'],
    vars: {
      primary: '#DB2777',
      primaryForeground: '#FFF9F5',
      accent: '#0EA5E9',
      accentForeground: '#FFFFFF',
      bg: '#FFF9F5',
      surface: '#FFFFFF',
      text: '#1F2937',
      textMuted: '#6B5565',
      goldAccent: '#D4A017',
      patternOpacity: 0.08,
    },
  },
  'noir-minimal': {
    id: 'noir-minimal',
    name: 'Noir Minimal',
    tagline: 'Sobre et recueilli',
    tone: 'mourning',
    swatches: ['#1A1A1A', '#B8860B', '#F5F5F3'],
    vars: {
      primary: '#1A1A1A',
      primaryForeground: '#F5F5F3',
      accent: '#B8860B',
      accentForeground: '#F5F5F3',
      bg: '#F5F5F3',
      surface: '#FFFFFF',
      text: '#1A1A1A',
      textMuted: '#5B5B5B',
      goldAccent: '#B8860B',
      patternOpacity: 0,
    },
  },
};

export const PALETTE_IDS: readonly PaletteId[] = Object.keys(INVITATION_PALETTES) as PaletteId[];

export function isPaletteId(x: unknown): x is PaletteId {
  return typeof x === 'string' && x in INVITATION_PALETTES;
}

export function resolvePalette(id: string | null | undefined): InvitationPalette {
  if (id && isPaletteId(id)) return INVITATION_PALETTES[id];
  return INVITATION_PALETTES['sahel-or'];
}

/**
 * Smart default picked at ceremony creation time from the ceremony type.
 * Users can still change the palette later from the editor, except for DEUIL
 * which is locked to 'noir-minimal' end-to-end.
 */
export function defaultPaletteForType(
  type: 'MARIAGE' | 'BAPTEME' | 'ANNIVERSAIRE' | 'DEUIL' | 'AUTRE' | string,
): PaletteId {
  switch (type) {
    case 'DEUIL':
      return 'noir-minimal';
    case 'BAPTEME':
      return 'pastel-celeste';
    case 'ANNIVERSAIRE':
      return 'jade-imperial';
    case 'MARIAGE':
    case 'AUTRE':
    default:
      return 'sahel-or';
  }
}

/**
 * Called before PATCH to enforce the DEUIL lock: if the ceremony type is
 * DEUIL, the palette is forced to 'noir-minimal' regardless of what the
 * client submits. Non-DEUIL ceremonies can pick any palette id; an unknown
 * id falls back to 'sahel-or'.
 */
export function coercePaletteForType(
  type: string,
  requested: string | null | undefined,
): PaletteId {
  if (type === 'DEUIL') return 'noir-minimal';
  if (requested && isPaletteId(requested)) return requested;
  return defaultPaletteForType(type);
}

/**
 * Serialized record shipped to the client — includes everything needed to
 * render a swatch row and apply the palette on the invitation wrapper.
 * Keep in sync with InvitationPalette; this is what the API returns.
 */
export type PublicPalette = InvitationPalette;

/**
 * React-ready style object. Spread on the invitation wrapper like:
 *   <div style={paletteStyle(palette)}>
 */
export function paletteStyle(p: InvitationPalette): React.CSSProperties {
  return {
    '--inv-primary': p.vars.primary,
    '--inv-primary-foreground': p.vars.primaryForeground,
    '--inv-accent': p.vars.accent,
    '--inv-accent-foreground': p.vars.accentForeground,
    '--inv-bg': p.vars.bg,
    '--inv-surface': p.vars.surface,
    '--inv-text': p.vars.text,
    '--inv-text-muted': p.vars.textMuted,
    '--inv-gold': p.vars.goldAccent,
    '--inv-pattern-opacity': String(p.vars.patternOpacity),
  } as React.CSSProperties;
}
