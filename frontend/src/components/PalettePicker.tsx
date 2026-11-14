'use client';

import type { PaletteId } from '@/lib/invitation-palettes';
import { INVITATION_PALETTES, PALETTE_IDS } from '@/lib/invitation-palettes';

interface PalettePickerProps {
  value: PaletteId;
  onChange: (id: PaletteId) => void;
  /** When true (ceremony.type === 'DEUIL'), only mourning-toned palettes
   *  are selectable; every celebration palette is visually disabled. */
  locked?: boolean;
  disabled?: boolean;
}

export function PalettePicker({
  value,
  onChange,
  locked = false,
  disabled = false,
}: PalettePickerProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 md:p-4">
      <div className="mb-2.5">
        <h3 className="font-headings font-bold text-sm text-foreground leading-tight">
          Palette de l'invitation
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
          {locked
            ? 'Palettes adaptées au recueillement.'
            : 'Change le ton visuel de la carte sans toucher au texte.'}
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
        {PALETTE_IDS.map((id) => {
          const p = INVITATION_PALETTES[id];
          const isActive = value === id;
          const isDisabled = disabled || (locked && p.tone !== 'mourning');
          return (
            <button
              key={id}
              type="button"
              onClick={() => !isDisabled && onChange(id)}
              aria-pressed={isActive}
              aria-label={p.name}
              title={`${p.name} — ${p.tagline}`}
              disabled={isDisabled}
              className={`group relative text-left rounded-md border p-1.5 transition-all ${
                isActive
                  ? 'border-primary shadow-sm ring-1 ring-primary/40'
                  : 'border-border hover:border-primary/50'
              } ${isDisabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex gap-0.5 mb-1">
                {p.swatches.map((hex, i) => (
                  <span
                    key={i}
                    className="h-3 flex-1 rounded-sm"
                    style={{ backgroundColor: hex }}
                    aria-hidden
                  />
                ))}
              </div>
              <div className="text-[10px] font-body font-bold text-foreground leading-tight truncate">
                {p.name}
              </div>
              {isActive && (
                <span
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
