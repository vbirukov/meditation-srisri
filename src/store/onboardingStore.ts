import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PracticeSlot = 'morning' | 'day' | 'evening';

export const SLOT_DEFAULT_HOUR: Record<PracticeSlot, number> = {
  morning: 7,
  day: 13,
  evening: 20,
};

/** Preset hours (MSK) per slot — one tap, then optional exact minutes. */
export const SLOT_TIME_PRESETS: Record<PracticeSlot, number[]> = {
  morning: [6, 7, 8, 9],
  day: [12, 13, 14, 15],
  evening: [19, 20, 21, 22],
};

interface OnboardingState {
  completed: boolean;
  preferredSlot: PracticeSlot | null;
  /** Exact reminder clock (MSK), set in 2.3. */
  reminderHour: number | null;
  reminderMinute: number | null;
  complete: () => void;
  setPreferredSlot: (slot: PracticeSlot) => void;
  setReminderTime: (hour: number, minute?: number, slot?: PracticeSlot | null) => void;
  clearReminderTime: () => void;
}

export const useOnboardingStore = create(
  persist<OnboardingState>(
    (set) => ({
      completed: false,
      preferredSlot: null,
      reminderHour: null,
      reminderMinute: null,
      complete: () => set({ completed: true }),
      setPreferredSlot: (preferredSlot) =>
        set((s) => ({
          preferredSlot,
          // keep explicit time if already set; else default for slot
          reminderHour: s.reminderHour ?? SLOT_DEFAULT_HOUR[preferredSlot],
          reminderMinute: s.reminderMinute ?? 0,
        })),
      setReminderTime: (hour, minute = 0, slot = undefined) =>
        set((s) => ({
          preferredSlot: slot === undefined ? s.preferredSlot : slot,
          reminderHour: Math.max(0, Math.min(23, Math.round(hour))),
          reminderMinute: Math.max(0, Math.min(59, Math.round(minute))),
        })),
      clearReminderTime: () => set({ reminderHour: null, reminderMinute: null }),
    }),
    { name: 'meditate-onboarding' },
  ),
);

/** Short starters for day-1 — ≤15 min, one-tap ready. */
export const STARTER_GUIDED_IDS = ['om-short', 'smile'] as const;
export const STARTER_TIMER_SECONDS = 300;
export const STREAK_GOAL_DAYS = 14;

export function resolveReminderClock(state: {
  preferredSlot: PracticeSlot | null;
  reminderHour: number | null;
  reminderMinute: number | null;
}): { hour: number; minute: number; slot: PracticeSlot | null } {
  const slot = state.preferredSlot;
  const hour =
    state.reminderHour ?? (slot ? SLOT_DEFAULT_HOUR[slot] : 9);
  const minute = state.reminderMinute ?? 0;
  return { hour, minute, slot };
}
