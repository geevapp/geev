import { describe, expect, it } from 'vitest';

import { POST_SLUG_MAX_LENGTH, sanitizePostSlug } from '@/lib/post-slug';

describe('sanitizePostSlug', () => {
  it('strips path-like segments and keeps safe characters', () => {
    expect(sanitizePostSlug('../../admin', 'My Title Here')).toBe('admin');
  });

  it('falls back to title when slug becomes empty', () => {
    expect(sanitizePostSlug('...', 'Hello World')).toBe('hello-world');
  });

  it('normalizes to lowercase and truncates', () => {
    const long = 'a'.repeat(POST_SLUG_MAX_LENGTH + 20);
    const out = sanitizePostSlug(long, 'x');
    expect(out).toBe('a'.repeat(POST_SLUG_MAX_LENGTH));
    expect(out.length).toBe(POST_SLUG_MAX_LENGTH);
  });
});
