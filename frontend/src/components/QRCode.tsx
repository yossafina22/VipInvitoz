'use client';

import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  /** Value encoded by the QR — URL, slug URL or token. */
  value: string;
  /** Pixel size of the output SVG. Defaults to 180. */
  size?: number;
  /** Error correction level — "H" (default) tolerates up to 30% damage,
   *  so a QR photographed under uneven light still scans. */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  className?: string;
}

/**
 * Renders a real scannable QR code as an inline SVG. Generates on the
 * client after mount so SSR output stays stable (no hydration mismatch).
 * Falls back to a neutral placeholder square while generating.
 */
export function QRCode({
  value,
  size = 180,
  errorCorrectionLevel = 'H',
  className = '',
}: QRCodeProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const out = await QRCodeLib.toString(value, {
          type: 'svg',
          margin: 1,
          width: size,
          errorCorrectionLevel,
          color: {
            dark: '#1a1a1a',
            light: '#ffffff',
          },
        });
        if (!cancelled) setSvg(out);
      } catch {
        if (!cancelled) setSvg(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size, errorCorrectionLevel]);

  if (!svg) {
    return (
      <div
        className={`bg-muted rounded animate-pulse ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="QR code de l’invitation"
      // Trusted content — generated from a URL we control, not user input rendered as HTML.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
