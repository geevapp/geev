import { describe, it, expect } from 'vitest';
import { calculateXP, isPostExpired } from '@/lib/utils';

describe('Utils', () => {
  describe('calculateXP', () => {
    it('should calculate XP for creating a post', () => {
      const xp = calculateXP('post_created');
      expect(xp).toBe(10);
    });

    it('should calculate XP for winning a giveaway', () => {
      const xp = calculateXP('giveaway_won');
      expect(xp).toBe(50);
    });
  });

  describe('isPostExpired', () => {
    it('should return true for expired posts', () => {
      const pastDate = new Date(Date.now() - 1000);
      expect(isPostExpired(pastDate)).toBe(true);
    });

    it('should return false for active posts', () => {
      const futureDate = new Date(Date.now() + 1000);
      expect(isPostExpired(futureDate)).toBe(false);
    });
  });
});
