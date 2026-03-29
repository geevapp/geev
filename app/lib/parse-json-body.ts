import { NextRequest } from 'next/server';

import { apiError } from '@/lib/api-response';

/** Default cap for JSON request bodies on API routes (manual check; see also next.config serverActions.bodySizeLimit). */
export const DEFAULT_JSON_BODY_MAX_BYTES = 512 * 1024;

export type ReadJsonBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

function isJsonContentType(request: NextRequest): boolean {
  const ct = request.headers.get('content-type');
  if (!ct) return false;
  const base = ct.split(';')[0]?.trim().toLowerCase();
  return base === 'application/json';
}

/**
 * Validates Content-Type, enforces a max body size, and parses JSON.
 * Use instead of raw `request.json()` on write endpoints.
 */
export async function readJsonBody<T = unknown>(
  request: NextRequest,
  maxBytes: number = DEFAULT_JSON_BODY_MAX_BYTES,
): Promise<ReadJsonBodyResult<T>> {
  if (!isJsonContentType(request)) {
    return {
      ok: false,
      response: apiError('Content-Type must be application/json', 415),
    };
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const len = Number.parseInt(contentLength, 10);
    if (Number.isFinite(len) && len > maxBytes) {
      return { ok: false, response: apiError('Payload too large', 413) };
    }
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: apiError('Invalid or missing body', 400) };
  }

  if (text.length > maxBytes) {
    return { ok: false, response: apiError('Payload too large', 413) };
  }

  try {
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, response: apiError('Invalid JSON body', 400) };
  }
}
