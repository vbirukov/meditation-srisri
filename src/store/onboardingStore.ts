import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PracticeSlot = 'morning' | 'day' | 'evening';

interface OnboardingState {
  completed: boolean;
  preferredSlot: PracticeSlot | null;
  complete: () => void;
  setPreferredSlot: (slot: PracticeSlot) => void;
}

export const useOnboardingStore = create(
  persist<OnboardingState>(
    (set) => ({
      completed: false,
      preferredSlot: null,
      complete: () => set({ completed: true }),
      setPreferredSlot: (preferredSlot) => set({ preferredSlot }),
    }),
    { name: 'meditate-onboarding' },
  ),
);

/** Short starters for day-1 — ≤15 min, one-tap ready. */
export const STARTER_GUIDED_IDS = ['om-short', 'smile'] as const;
export const STARTER_TIMER_SECONDS = 300;
export const STREAK_GOAL_DAYS = 14;
