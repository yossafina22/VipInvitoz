import { NextRequest } from 'next/server';

export function jsonRequest(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
  opts: { csrf?: boolean } = {},
): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.csrf !== false) {
    headers['x-csrf-token'] = 'csrf-tok';
    headers['cookie'] = 'app-csrf=csrf-tok';
  }
  return body === undefined
    ? new NextRequest(url, { method, headers })
    : new NextRequest(url, { method, headers, body: JSON.stringify(body) });
}

export const params = (id: string) => ({ params: Promise.resolve({ id }) });
