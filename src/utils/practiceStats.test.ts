import { describe, expect, it } from 'vitest';
import {
  getStreakView,
  nextStreakDays,
  toDateKey,
  yesterdayKey,
} from '@/utils/practiceStats';

describe('session complete → streak', () => {
  it('starts streak at 1 on first practice day', () => {
    expect(nextStreakDays(null, '2026-03-15', 0)).toBe(1);
  });

  it('increments when practicing on consecutive days', () => {
    const today = '2026-03-15';
    const y = yesterdayKey(today);
    expect(nextStreakDays(y, today, 4)).toBe(5);
  });

  it('does not double-count same day', () => {
    expect(nextStreakDays('2026-03-15', '2026-03-15', 3)).toBe(3);
  });

  it('resets after a gap', () => {
    expect(nextStreakDays('2026-03-10', '2026-03-15', 9)).toBe(1);
  });

  it('getStreakView marks at-risk when yesterday practiced but not today', () => {
    const now = new Date(2026, 2, 15);
    const y = yesterdayKey(toDateKey(now));
    const view = getStreakView(y, 5, now);
    expect(view).toEqual({ days: 5, practicedToday: false, atRisk: true });
  });
});
