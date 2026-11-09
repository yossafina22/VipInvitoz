import NextImage from 'next/image';

type AspectRatio = '1:1' | '4:3' | '16:9' | '3:4' | '16:4';

const ASPECT: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  '3:4': 'aspect-[3/4]',
  '16:4': 'aspect-[16/4]',
};

const DIMENSIONS: Record<AspectRatio, { w: number; h: number }> = {
  '1:1': { w: 800, h: 800 },
  '4:3': { w: 1200, h: 900 },
  '16:9': { w: 1600, h: 900 },
  '3:4': { w: 900, h: 1200 },
  '16:4': { w: 1920, h: 480 },
};

const DEFAULT_SIZES: Record<AspectRatio, string> = {
  '1:1': '(min-width: 1024px) 160px, 33vw',
  '4:3': '(min-width: 1024px) 50vw, 100vw',
  '16:9': '100vw',
  '3:4': '(min-width: 1024px) 50vw, 100vw',
  '16:4': '100vw',
};

interface ImageProps {
  ar?: AspectRatio;
  /** Keywords for photo lookup, comma-separated. e.g. "african,wedding,couple" */
  keywords?: string;
  /** Explicit URL override. Wins over keywords. */
  src?: string;
  /** Alt / aria-label; also used as the lock seed when keywords are provided. */
  prompt?: string;
  alt?: string;
  className?: string;
  /** CSS object-position for the inner <img>. Defaults to "center".
   * Use "top" / "center top" / "50% 20%" to control where cropping bites.
   */
  objectPosition?: string;
  /** Switch from "cover" (fill + crop) to "contain" (show full, may letterbox). */
  fit?: 'cover' | 'contain';
  /** Next/image sizes override. Only applied to local /public images. Defaults by aspect ratio. */
  sizes?: string;
  /** Mark hero/above-the-fold images to skip lazy-loading and preload them. */
  priority?: boolean;
}

function hashLock(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100000;
}

/** Build a loremflickr URL. `lock` deterministically picks the same photo for
 * the same (keywords, prompt) pair across renders. */
function loremflickrUrl(keywords: string, prompt: string, w: number, h: number): string {
  const slug = keywords
    .split(/[\s,]+/)
    .filter(Boolean)
    .join(',');
  const lock = hashLock(`${keywords}|${prompt}`);
  return `https://loremflickr.com/${w}/${h}/${slug}?lock=${lock}`;
}

export function Image({
  ar = '1:1',
  keywords,
  src,
  prompt,
  alt,
  className = '',
  objectPosition = 'center',
  fit = 'cover',
  sizes,
  priority = false,
}: ImageProps) {
  const aspectClass = ASPECT[ar];
  const label = alt ?? prompt ?? '';
  const { w, h } = DIMENSIONS[ar];

  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover';
  const wrapperClass = `${aspectClass} overflow-hidden relative bg-gradient-to-br from-wax-orange/30 via-gold/20 to-wax-teal/20 ${className}`;
  const isLocalAsset = src?.startsWith('/') ?? false;

  if (src && isLocalAsset) {
    return (
      <div className={wrapperClass} role="img" aria-label={label}>
        <NextImage
          src={src}
          alt={label}
          fill
          sizes={sizes ?? DEFAULT_SIZES[ar]}
          quality={90}
          priority={priority}
          className={fitClass}
          style={{ objectPosition }}
        />
      </div>
    );
  }

  let resolvedSrc: string | null = null;
  if (src) {
    resolvedSrc = src;
  } else if (keywords) {
    resolvedSrc = loremflickrUrl(keywords, prompt ?? keywords, w, h);
  }

  return (
    <div className={wrapperClass} role="img" aria-label={label}>
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={label}
          className={`w-full h-full ${fitClass}`}
          style={{ objectPosition }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-5xl opacity-30 select-none">📸</span>
        </div>
      )}
    </div>
  );
}
