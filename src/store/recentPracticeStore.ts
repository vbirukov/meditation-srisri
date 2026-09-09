import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PracticeTab } from '@/types';

interface RecentPracticeState {
  lastTab: PracticeTab | null;
  lastMeditationId: string | null;
  lastSadhanaId: string | null;
  lastCustomPracticeId: string | null;
  updatedAt: number;
  setLastTab: (tab: PracticeTab) => void;
  setLastMeditation: (id: string) => void;
  setLastSadhana: (id: string) => void;
  setLastCustomPractice: (id: string) => void;
  clearLastCustomPracticeIf: (id: string) => void;
}

const touch = () => Date.now();

export const useRecentPracticeStore = create(
  persist<RecentPracticeState>(
    (set) => ({
      lastTab: null,
      lastMeditationId: null,
      lastSadhanaId: null,
      lastCustomPracticeId: null,
      updatedAt: 0,
      setLastTab: (tab) => set({ lastTab: tab, updatedAt: touch() }),
      setLastMeditation: (id) =>
        set({
          lastMeditationId: id,
          lastTab: 'meditations',
          lastSadhanaId: null,
          lastCustomPracticeId: null,
          updatedAt: touch(),
        }),
      setLastSadhana: (id) =>
        set({
          lastSadhanaId: id,
          lastTab: 'sadhana',
          lastMeditationId: null,
          lastCustomPracticeId: null,
          updatedAt: touch(),
        }),
      setLastCustomPractice: (id) =>
        set({
          lastCustomPracticeId: id,
          lastTab: 'sadhana',
          lastMeditationId: null,
          lastSadhanaId: null,
          updatedAt: touch(),
        }),
      clearLastCustomPracticeIf: (id) =>
        set((s) =>
          s.lastCustomPracticeId === id
            ? { lastCustomPracticeId: null, updatedAt: touch() }
            : {},
        ),
    }),
    { name: 'meditate-recent-practice' },
  ),
);
