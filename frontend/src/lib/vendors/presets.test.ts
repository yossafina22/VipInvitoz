import { describe, it, expect } from 'vitest';
import { VENDOR_PRESETS, VENDOR_PRESET_KEYS, isVendorPresetKey } from './presets';

// Index into DEFAULT_CATEGORY_LABELS (budget.ts): 0 venue, 1 catering, 2 outfits,
// 3 photo, 4 music, 5 misc.
const BUDGET_CATEGORY_COUNT = 6;

describe('VENDOR_PRESETS', () => {
  it('defines 12 presets with unique keys', () => {
    expect(VENDOR_PRESET_KEYS).toHaveLength(12);
    expect(new Set(VENDOR_PRESET_KEYS).size).toBe(12);
  });

  it('maps every preset to an existing budget category index', () => {
    for (const key of VENDOR_PRESET_KEYS) {
      const idx = VENDOR_PRESETS[key].budgetCategoryIndex;
      expect(Number.isInteger(idx) && idx >= 0 && idx < BUDGET_CATEGORY_COUNT).toBe(true);
    }
  });

  it('sends catering to the catering category and transport to misc', () => {
    expect(VENDOR_PRESETS.catering.budgetCategoryIndex).toBe(1);
    expect(VENDOR_PRESETS.transport.budgetCategoryIndex).toBe(5);
  });

  it('recognises preset keys', () => {
    expect(isVendorPresetKey('photo')).toBe(true);
    expect(isVendorPresetKey('nope')).toBe(false);
  });
});
