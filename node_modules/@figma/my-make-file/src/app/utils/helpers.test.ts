import { describe, it, expect } from 'vitest';
import { timeAgo, getAvatarUrl } from './helpers';

describe('helpers', () => {
  describe('timeAgo', () => {
    it('should format dates properly', () => {
      const now = Date.now();
      
      const justNow = new Date(now - 1000).toISOString();
      expect(timeAgo(justNow)).toBe('just now');
      
      const minsAgo = new Date(now - 5 * 60 * 1000).toISOString();
      expect(timeAgo(minsAgo)).toBe('5m ago');
      
      const hoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(hoursAgo)).toBe('2h ago');
      
      const daysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(daysAgo)).toBe('3d ago');
    });
  });

  describe('getAvatarUrl', () => {
    it('should generate deterministic avatar urls based on id', () => {
      const url1 = getAvatarUrl('user1');
      const url2 = getAvatarUrl('user2');
      
      expect(url1).toContain('dicebear.com');
      expect(url1).toBe(getAvatarUrl('user1')); // Deterministic
      expect(url1).not.toBe(url2);
    });
  });
});
