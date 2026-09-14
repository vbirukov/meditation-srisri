import { describe, expect, it, beforeEach } from 'vitest';
import {
  hasCompletedSadhanaBefore,
  markSadhanaCompletedForShare,
  shouldOfferShare,
} from '@/utils/shareOffer';

function mockStorage() {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true });
}

describe('shouldOfferShare', () => {
  beforeEach(() => {
    mockStorage();
    localStorage.clear();
  });

  it('offers on first session and streak peaks', () => {
    expect(shouldOfferShare({ totalSessions: 1, streakDays: 1 })).toBe(true);
    expect(shouldOfferShare({ totalSessions: 5, streakDays: 7 })).toBe(true);
    expect(shouldOfferShare({ totalSessions: 5, streakDays: 3, mode: 'guided' })).toBe(false);
  });

  it('offers once for first sadhana', () => {
    expect(shouldOfferShare({ totalSessions: 4, streakDays: 2, mode: 'sadhana' })).toBe(true);
    markSadhanaCompletedForShare();
    expect(hasCompletedSadhanaBefore()).toBe(true);
    expect(shouldOfferShare({ totalSessions: 5, streakDays: 2, mode: 'sadhana' })).toBe(false);
  });
});
