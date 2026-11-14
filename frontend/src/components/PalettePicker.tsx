'use client';

import type { PaletteId } from '@/lib/invitation-palettes';
import { INVITATION_PALETTES, PALETTE_IDS } from '@/lib/invitation-palettes';

interface PalettePickerProps {
  value: PaletteId;
  onChange: (id: PaletteId) => void;
  /** When true (ceremony.type === 'DEUIL'), the picker is locked on
   *  'noir-minimal' and every other option is visually disabled. */
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
    <div className="bg-card border border-border rounded-xl p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-headings font-bold text-sm text-foreground">
            Palette de l'invitation
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locked
              ? 'Palette adaptée au recueillement — non modifiable.'
              : "Change le ton visuel de la carte d'invitation sans toucher au texte."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {PALETTE_IDS.map((id) => {
          const p = INVITATION_PALETTES[id];
          const isActive = value === id;
          const isDisabled = disabled || (locked && id !== 'noir-minimal');
          return (
            <button
              key={id}
              type="button"
              onClick={() => !isDisabled && onChange(id)}
              aria-pressed={isActive}
              disabled={isDisabled}
              className={`group relative text-left rounded-lg border-2 p-2.5 transition-all ${
                isActive ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
              } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex gap-1 mb-2">
                {p.swatches.map((hex, i) => (
                  <span
                    key={i}
                    className="h-6 flex-1 rounded"
                    style={{ backgroundColor: hex }}
                    aria-hidden
                  />
                ))}
              </div>
              <div className="text-xs font-body font-bold text-foreground leading-tight truncate">
                {p.name}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.tagline}</div>
              {isActive && (
                <span
                  className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full"
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
