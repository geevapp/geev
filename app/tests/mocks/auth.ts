import { vi } from 'vitest';

export const mockGetCurrentUser = vi.fn();

vi.mock('@/lib/auth', () => ({
  getCurrentUser: mockGetCurrentUser,
}));
