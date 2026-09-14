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
  /** Mood after session (set on EndScreen). Data only for now. */
  mood?: string | null;
}

interface PracticeStatsState {
  totalSessions: number;
  streakDays: number;
  lastPracticeDate: string | null;
  monthKey: string;
  secondsThisMonth: number;
  lastSession: LastPracticeSession | null;
  /** Recent moods for later analytics — capped, no UI yet. */
  moodLog: Array<{ completedAt: number; mood: string }>;
  recordSession: (session: Omit<LastPracticeSession, 'completedAt' | 'mood'>) => void;
  setLastSessionMood: (mood: string) => void;
}

const MOOD_LOG_MAX = 60;

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
      moodLog: [],

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
          lastSession: { ...session, completedAt, mood: null },
        });
      },

      setLastSessionMood: (mood) => {
        const trimmed = mood.trim();
        if (!trimmed) return;
        const state = get();
        const last = state.lastSession;
        if (!last) return;

        const moodLog = [
          ...(state.moodLog ?? []).filter((e) => e.completedAt !== last.completedAt),
          { completedAt: last.completedAt, mood: trimmed },
        ].slice(-MOOD_LOG_MAX);

        set({
          lastSession: { ...last, mood: trimmed },
          moodLog,
        });
      },
    }),
    { name: 'meditate-practice-stats' },
  ),
);
