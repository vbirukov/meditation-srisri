import { create } from 'zustand';
import type { MeditationSession, SessionMode } from '@/types';

interface SessionStore extends MeditationSession {
  mood: string | null;
  setMode: (mode: SessionMode, practiceId?: string) => void;
  setTargetDuration: (seconds: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  tick: (progressSeconds: number) => void;
  complete: () => void;
  reset: () => void;
  setMood: (mood: string | null) => void;
}

const initial: MeditationSession = {
  mode: 'timer',
  meditationId: undefined,
  sadhanaId: undefined,
  targetDurationSeconds: 600,
  startedAt: null,
  pausedAt: null,
  progressSeconds: 0,
  isCompleted: false,
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...initial,
  mood: null,

  setMode: (mode, practiceId) =>
    set({
      mode,
      meditationId: mode === 'guided' ? practiceId : undefined,
      sadhanaId: mode === 'sadhana' ? practiceId : undefined,
      isCompleted: false,
      progressSeconds: 0,
      startedAt: null,
      pausedAt: null,
    }),

  setTargetDuration: (targetDurationSeconds) =>
    set({ targetDurationSeconds, progressSeconds: 0 }),

  start: () => {
    const now = Date.now();
    set({
      startedAt: now,
      pausedAt: null,
      isCompleted: false,
      progressSeconds: 0,
    });
  },

  pause: () => {
    const { startedAt, pausedAt, progressSeconds } = get();
    if (!startedAt || pausedAt) return;
    set({ pausedAt: Date.now(), progressSeconds });
  },

  resume: () => {
    const { startedAt, pausedAt, progressSeconds } = get();
    if (!startedAt || !pausedAt) return;
    const pauseDuration = Date.now() - pausedAt;
    set({
      startedAt: startedAt + pauseDuration,
      pausedAt: null,
      progressSeconds,
    });
  },

  tick: (progressSeconds) => set({ progressSeconds }),

  complete: () => set({ isCompleted: true, pausedAt: null }),

  reset: () => set({ ...initial, mood: null }),

  setMood: (mood) => set({ mood }),
}));
