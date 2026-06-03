import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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
  setTimerRunning: (running: boolean) => void;
  setSadhanaPhaseState: (index: number, progressSeconds: number) => void;
  setGuidedAudioSeconds: (seconds: number) => void;
}

const initial: MeditationSession = {
  mode: 'timer',
  meditationId: undefined,
  sadhanaId: undefined,
  customPracticeId: undefined,
  targetDurationSeconds: 600,
  startedAt: null,
  pausedAt: null,
  progressSeconds: 0,
  isCompleted: false,
  sadhanaPhaseIndex: 0,
  sadhanaPhaseProgress: 0,
  timerRunning: false,
  guidedAudioSeconds: 0,
};

export const useSessionStore = create(
  persist<SessionStore>(
    (set, get) => ({
      ...initial,
      mood: null,

      setMode: (mode, practiceId) =>
        set({
          mode,
          meditationId: mode === 'guided' ? practiceId : undefined,
          sadhanaId: mode === 'sadhana' ? practiceId : undefined,
          customPracticeId: mode === 'custom-practice' ? practiceId : undefined,
          isCompleted: false,
          progressSeconds: 0,
          startedAt: null,
          pausedAt: null,
          sadhanaPhaseIndex: 0,
          sadhanaPhaseProgress: 0,
          timerRunning: false,
          guidedAudioSeconds: 0,
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

      complete: () => set({ isCompleted: true, pausedAt: null, timerRunning: false }),

      reset: () => set({ ...initial, mood: null }),

      setMood: (mood) => set({ mood }),

      setTimerRunning: (timerRunning) => set({ timerRunning }),

      setSadhanaPhaseState: (sadhanaPhaseIndex, sadhanaPhaseProgress) =>
        set({ sadhanaPhaseIndex, sadhanaPhaseProgress }),

      setGuidedAudioSeconds: (guidedAudioSeconds) => set({ guidedAudioSeconds }),
    }),
    {
      name: 'meditate-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) =>
        ({
          mode: state.mode,
          meditationId: state.meditationId,
          sadhanaId: state.sadhanaId,
          customPracticeId: state.customPracticeId,
          targetDurationSeconds: state.targetDurationSeconds,
          startedAt: state.startedAt,
          pausedAt: state.pausedAt,
          progressSeconds: state.progressSeconds,
          isCompleted: state.isCompleted,
          sadhanaPhaseIndex: state.sadhanaPhaseIndex,
          sadhanaPhaseProgress: state.sadhanaPhaseProgress,
          timerRunning: state.timerRunning,
          guidedAudioSeconds: state.guidedAudioSeconds,
        }) as SessionStore,
    },
  ),
);
