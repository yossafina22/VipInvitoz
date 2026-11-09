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

/**
 * POST a single file to /api/upload. Returns the created FileUpload row
 * merged with the public secure_url (Cloudinary). Throws ApiError on
 * non-2xx, which carries `.code` (STORAGE_NOT_CONFIGURED,
 * UPLOAD_MISSING_FILE, FILE_TOO_LARGE, INVALID_MIME,
 * MAGIC_BYTE_MISMATCH, HEIC_CONVERSION_FAILED, UPLOAD_FAILED).
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append('file', file);

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
