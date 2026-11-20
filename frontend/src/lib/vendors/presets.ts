// Predefined vendor types. Labels live in messages (`vendors.presets.<key>`);
// budgetCategoryIndex points into DEFAULT_CATEGORY_LABELS (lib/server/vipinvitoz/budget.ts):
// 0 venue & decor, 1 catering, 2 outfits, 3 photo & video, 4 DJ & music, 5 misc.

export interface VendorPreset {
  icon: string;
  tile: string;
  budgetCategoryIndex: number;
}

export const VENDOR_PRESETS = {
  venue: { icon: 'building-2', tile: 'bg-wax-teal/15 text-wax-teal', budgetCategoryIndex: 0 },
  catering: { icon: 'utensils', tile: 'bg-wax-orange/15 text-wax-orange', budgetCategoryIndex: 1 },
  cake: { icon: 'cake', tile: 'bg-gold/15 text-gold', budgetCategoryIndex: 1 },
  photo: { icon: 'camera', tile: 'bg-primary/15 text-primary', budgetCategoryIndex: 3 },
  video: { icon: 'video', tile: 'bg-primary/15 text-primary', budgetCategoryIndex: 3 },
  dj: { icon: 'music', tile: 'bg-success/15 text-success', budgetCategoryIndex: 4 },
  griot: { icon: 'mic', tile: 'bg-success/15 text-success', budgetCategoryIndex: 4 },
  decor: { icon: 'sparkles', tile: 'bg-gold/15 text-gold', budgetCategoryIndex: 0 },
  florist: { icon: 'flower', tile: 'bg-wax-orange/15 text-wax-orange', budgetCategoryIndex: 0 },
  outfits: { icon: 'shirt', tile: 'bg-wax-teal/15 text-wax-teal', budgetCategoryIndex: 2 },
  beauty: { icon: 'scissors', tile: 'bg-primary/15 text-primary', budgetCategoryIndex: 2 },
  transport: { icon: 'car', tile: 'bg-muted text-muted-foreground', budgetCategoryIndex: 5 },
} as const satisfies Record<string, VendorPreset>;

export type VendorPresetKey = keyof typeof VENDOR_PRESETS;

export const VENDOR_PRESET_KEYS = Object.keys(VENDOR_PRESETS) as VendorPresetKey[];

export function isVendorPresetKey(value: string): value is VendorPresetKey {
  return Object.prototype.hasOwnProperty.call(VENDOR_PRESETS, value);
}

/** Budget category used for custom (non-preset) vendors: misc. */
export const CUSTOM_VENDOR_CATEGORY_INDEX = 5;
