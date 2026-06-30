/**
 * Pagination query-parameter parsing utilities.
 *
 * These endpoints historically read pagination params with `parseInt(...)` and
 * guarded them with a `value < 1` check. Because `parseInt("abc")` returns `NaN`
 * and `NaN < 1` evaluates to `false`, non-numeric values slipped past validation
 * and reached Prisma's `skip`/`take`, which threw and surfaced as opaque HTTP 500s.
 * There was also no upper bound on `limit`, allowing unbounded page sizes.
 *
 * These helpers parse with `Number(...)`, fall back to sane defaults for missing
 * or non-numeric input, and clamp the result into a safe `[min, max]` range.
 */

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

/**
 * Parse a raw query value into an integer, falling back to `fallback` for
 * missing/non-numeric input and clamping the result to `[min, max]`.
 */
export function clampInt(
  raw: string | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === null || raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const value = Math.trunc(parsed);
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Parse page-based pagination (`page` + `limit`) and derive `skip`.
 * `page` is clamped to `>= 1`; `limit` is clamped to `[1, maxLimit]`.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {},
): Pagination {
  const { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = options;

  const page = clampInt(searchParams.get("page"), DEFAULT_PAGE, 1, Number.MAX_SAFE_INTEGER);
  const limit = clampInt(searchParams.get("limit"), defaultLimit, 1, maxLimit);

  return { page, limit, skip: (page - 1) * limit };
}

export interface OffsetPagination {
  limit: number;
  skip: number;
}

/**
 * Parse offset-based pagination (`limit` + `skip`).
 * `limit` is clamped to `[1, maxLimit]`; `skip` is clamped to `>= 0`.
 */
export function parseOffsetPagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {},
): OffsetPagination {
  const { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = options;

  const limit = clampInt(searchParams.get("limit"), defaultLimit, 1, maxLimit);
  const skip = clampInt(searchParams.get("skip"), 0, 0, Number.MAX_SAFE_INTEGER);

  return { limit, skip };
}
