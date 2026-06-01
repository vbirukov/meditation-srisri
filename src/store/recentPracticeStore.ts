import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PracticeTab } from '@/types';

interface RecentPracticeState {
  lastTab: PracticeTab | null;
  lastMeditationId: string | null;
  lastSadhanaId: string | null;
  lastCustomPracticeId: string | null;
  setLastMeditation: (id: string) => void;
  setLastSadhana: (id: string) => void;
  setLastCustomPractice: (id: string) => void;
  clearLastCustomPracticeIf: (id: string) => void;
}

export const useRecentPracticeStore = create(
  persist<RecentPracticeState>(
    (set) => ({
      lastTab: null,
      lastMeditationId: null,
      lastSadhanaId: null,
      lastCustomPracticeId: null,
      setLastMeditation: (id) =>
        set({
          lastMeditationId: id,
          lastTab: 'meditations',
          lastSadhanaId: null,
          lastCustomPracticeId: null,
        }),
      setLastSadhana: (id) =>
        set({
          lastSadhanaId: id,
          lastTab: 'sadhana',
          lastMeditationId: null,
          lastCustomPracticeId: null,
        }),
      setLastCustomPractice: (id) =>
        set({
          lastCustomPracticeId: id,
          lastTab: 'sadhana',
          lastMeditationId: null,
          lastSadhanaId: null,
        }),
      clearLastCustomPracticeIf: (id) =>
        set((s) =>
          s.lastCustomPracticeId === id ? { lastCustomPracticeId: null } : {},
        ),
    }),
    { name: 'meditate-recent-practice' },
  ),
);
