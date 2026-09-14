import { STREAK_GOAL_DAYS } from '@/store/onboardingStore';
import type { SessionMode } from '@/types';

const FIRST_SADHANA_KEY = 'meditate-first-sadhana-done';

/** Peak moments for share CTA — not after every session. */
export function shouldOfferShare(opts: {
  streakDays: number;
  mode?: SessionMode | null;
  totalSessions: number;
}): boolean {
  if (opts.totalSessions === 1) return true;
  if (
    opts.streakDays === 7 ||
    opts.streakDays === 14 ||
    opts.streakDays === STREAK_GOAL_DAYS
  ) {
    return true;
  }
  if (opts.mode === 'sadhana' && !hasCompletedSadhanaBefore()) {
    return true;
  }
  return false;
}

export function hasCompletedSadhanaBefore(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(FIRST_SADHANA_KEY) === '1';
  } catch {
    return false;
  }
}

/** Call after EndScreen has decided to show/hide share for a sadhana session. */
export function markSadhanaCompletedForShare(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FIRST_SADHANA_KEY, '1');
  } catch {
    /* ignore */
  }
}
