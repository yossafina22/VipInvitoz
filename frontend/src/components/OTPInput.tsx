'use client';

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';

interface OTPInputProps {
  digits?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ digits = 6, value, onChange, disabled }: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [internal, setInternal] = useState('');
  const current = value ?? internal;

  const set = (next: string) => {
    const trimmed = next.slice(0, digits);
    setInternal(trimmed);
    onChange?.(trimmed);
  };

  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = Array.from({ length: digits }, (_, k) => current[k] ?? '');
    chars[i] = digit;
    const next = chars.join('').replace(/\s+$/, '');
    set(next);
    if (digit && i < digits - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !current[i] && i > 0) {
      e.preventDefault();
      const chars = Array.from({ length: digits }, (_, k) => current[k] ?? '');
      chars[i - 1] = '';
      set(chars.join('').replace(/\s+$/, ''));
      refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < digits - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits);
    if (!pasted) return;
    set(pasted);
    const nextIndex = Math.min(pasted.length, digits - 1);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {Array.from({ length: digits }).map((_, i) => {
        const char = current[i] ?? '';
        const filled = Boolean(char);
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={char}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-10 h-12 sm:w-12 sm:h-14 rounded-lg border-2 text-center font-headings font-bold text-lg sm:text-xl focus:outline-none ${
              filled
                ? 'border-primary bg-secondary text-primary'
                : 'border-border bg-input text-foreground focus:border-primary focus:bg-background'
            } disabled:opacity-50`}
            aria-label={`Chiffre ${i + 1} sur ${digits}`}
          />
        );
      })}
    </div>
  );
}
