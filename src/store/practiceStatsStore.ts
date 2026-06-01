import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionMode } from '@/types';
import {
  nextStreakDays,
  toDateKey,
  toMonthKey,
} from '@/utils/practiceStats';

export interface LastPracticeSession {
  mode: SessionMode;
  meditationId?: string;
  sadhanaId?: string;
  customPracticeId?: string;
  durationSeconds: number;
  completedAt: number;
}

interface PracticeStatsState {
  totalSessions: number;
  streakDays: number;
  lastPracticeDate: string | null;
  monthKey: string;
  secondsThisMonth: number;
  lastSession: LastPracticeSession | null;
  recordSession: (session: Omit<LastPracticeSession, 'completedAt'>) => void;
}

const now = new Date();

export const usePracticeStatsStore = create(
  persist<PracticeStatsState>(
    (set, get) => ({
      totalSessions: 0,
      streakDays: 0,
      lastPracticeDate: null,
      monthKey: toMonthKey(now),
      secondsThisMonth: 0,
      lastSession: null,

      recordSession: (session) => {
        const completedAt = Date.now();
        const today = toDateKey(new Date(completedAt));
        const month = toMonthKey(new Date(completedAt));
        const state = get();

        const monthChanged = state.monthKey !== month;
        const secondsThisMonth = monthChanged
          ? session.durationSeconds
          : state.secondsThisMonth + session.durationSeconds;

        set({
          totalSessions: state.totalSessions + 1,
          streakDays: nextStreakDays(state.lastPracticeDate, today, state.streakDays),
          lastPracticeDate: today,
          monthKey: month,
          secondsThisMonth,
          lastSession: { ...session, completedAt },
        });
      },
    }),
    { name: 'meditate-practice-stats' },
  ),
);
