/** Max length for post slugs (must match DB and API validation). */
export const POST_SLUG_MAX_LENGTH = 50;

/**
 * Produces a URL-safe slug: lowercase, [a-z0-9-] only, max {@link POST_SLUG_MAX_LENGTH} chars.
 * Path segments like `../` are stripped; empty result falls back to the title-derived slug.
 */
export function sanitizePostSlug(
  raw: unknown,
  title: string,
): string {
  const fromTitle = (): string => {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const s = base.slice(0, POST_SLUG_MAX_LENGTH);
    return s.length > 0 ? s : 'post';
  };

  if (raw == null || raw === '') {
    return fromTitle();
  }

  if (typeof raw !== 'string') {
    return fromTitle();
  }

  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') {
    return fromTitle();
  }

  const only = trimmed
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (only === '') {
    return fromTitle();
  }

  return only.slice(0, POST_SLUG_MAX_LENGTH);
}
