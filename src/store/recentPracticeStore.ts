import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PracticeTab } from '@/types';

interface RecentPracticeState {
  lastTab: PracticeTab | null;
  lastMeditationId: string | null;
  lastSadhanaId: string | null;
  setLastMeditation: (id: string) => void;
  setLastSadhana: (id: string) => void;
}

export const useRecentPracticeStore = create(
  persist<RecentPracticeState>(
    (set) => ({
      lastTab: null,
      lastMeditationId: null,
      lastSadhanaId: null,
      setLastMeditation: (id) =>
        set({ lastMeditationId: id, lastTab: 'meditations', lastSadhanaId: null }),
      setLastSadhana: (id) =>
        set({ lastSadhanaId: id, lastTab: 'sadhana', lastMeditationId: null }),
    }),
    { name: 'meditate-recent-practice' },
  ),
);
