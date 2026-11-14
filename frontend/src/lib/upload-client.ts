// Client-side upload helper — separate from api() because it needs
// multipart/form-data instead of JSON. Keeps the CSRF double-submit
// pattern aligned with the shared api() wrapper so the /api/upload
// route sees the same verifyCsrf check.

import { API_URL, COOKIE_PREFIX } from './constants';
import { ApiError } from './api';

const CSRF_COOKIE_NAME = `${COOKIE_PREFIX}-csrf`;

function readCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem(CSRF_COOKIE_NAME);
  if (fromStorage) return fromStorage;
  const escaped = CSRF_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

export interface UploadResult {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

/** Max side (px) we keep for user-uploaded images — 2000px is plenty for a
 *  cover photo and keeps the file small enough to clear mobile uploads. */
const MAX_IMAGE_SIDE = 2000;
/** Above this size we always try to downscale (phone photos are often 5-15MB
 *  while a 2000px JPEG tops out around 400-800 KB). */
const DOWNSCALE_THRESHOLD_BYTES = 1.5 * 1024 * 1024;
/** HEIC/HEIF goes straight to the server — most browsers can't decode it in
 *  canvas. The server's `heicConvert` pipeline handles it. */
const CANVAS_UNFRIENDLY = new Set(['image/heic', 'image/heif']);

/**
 * Client-side downscale: load into an Image, draw on a canvas limited to
 * MAX_IMAGE_SIDE, re-encode as JPEG (q=0.85). Returns the original File on
 * any failure — the server still enforces size + MIME + magic-byte gates,
 * so a rough pass through canvas never relaxes safety.
 */
async function downscaleIfLarge(file: File): Promise<File> {
  if (CANVAS_UNFRIENDLY.has(file.type)) return file;
  if (file.size < DOWNSCALE_THRESHOLD_BYTES) return file;
  if (typeof window === 'undefined' || typeof document === 'undefined') return file;

  try {
    const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = URL.createObjectURL(file);
    });

    const { naturalWidth: w, naturalHeight: h } = bitmap;
    const longest = Math.max(w, h);
    if (longest <= MAX_IMAGE_SIDE) {
      URL.revokeObjectURL(bitmap.src);
      return file;
    }
    const scale = MAX_IMAGE_SIDE / longest;
    const outW = Math.round(w * scale);
    const outH = Math.round(h * scale);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const cx = canvas.getContext('2d');
    if (!cx) {
      URL.revokeObjectURL(bitmap.src);
      return file;
    }
    cx.drawImage(bitmap, 0, 0, outW, outH);
    URL.revokeObjectURL(bitmap.src);

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
    });
    if (!blob) return file;
    const outName = file.name.replace(/\.(heic|heif|png|webp|jpg|jpeg)$/i, '.jpg');
    return new File([blob], outName, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  }
}

/**
 * POST a single file to /api/upload. Returns the created FileUpload row
 * merged with the public secure_url (Cloudinary). Throws ApiError on
 * non-2xx, which carries `.code` (STORAGE_NOT_CONFIGURED,
 * UPLOAD_MISSING_FILE, FILE_TOO_LARGE, INVALID_MIME,
 * MAGIC_BYTE_MISMATCH, HEIC_CONVERSION_FAILED, UPLOAD_FAILED).
 *
 * Large photos coming from phone cameras are transparently downscaled to
 * 2000px JPEG before upload — a 12-megapixel iPhone shot (~6 MB) becomes
 * a ~600 KB JPEG without visible quality loss at invitation size.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const prepared = await downscaleIfLarge(file);
  const fd = new FormData();
  fd.append('file', prepared);

  const headers: Record<string, string> = {};
  const csrf = readCsrfToken();
  if (csrf) headers['x-csrf-token'] = csrf;

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      // body not JSON — leave empty.
    }
    const message =
      (typeof body.message === 'string' && body.message) ||
      (typeof body.code === 'string' && body.code) ||
      `Upload failed (HTTP ${res.status})`;
    // /api/upload returns `code`; normalize into the shape ApiError expects
    // (`error` field) so callers can switch on `.code` consistently.
    const errorBody: Record<string, unknown> = { ...body };
    if (typeof body.code === 'string' && typeof body.error !== 'string') {
      errorBody.error = body.code;
    }
    throw new ApiError(res.status, message, errorBody);
  }

  return (await res.json()) as UploadResult;
}
