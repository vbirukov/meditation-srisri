import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MeditationSession, SessionMode } from '@/types';

/** Soft-save abandon only below this fraction of target duration. */
export const ABANDON_SAVE_PCT = 0.5;

interface SessionStore extends MeditationSession {
  mood: string | null;
  /** Left mid-session with progress kept — hub can resume. */
  interrupted: boolean;
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
  markInterrupted: () => void;
  clearInterrupted: () => void;
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

export function sessionElapsedSeconds(s: {
  progressSeconds: number;
  guidedAudioSeconds?: number;
  sadhanaPhaseIndex?: number;
  sadhanaPhaseProgress?: number;
}): number {
  const guided = s.guidedAudioSeconds ?? 0;
  const phase =
    (s.sadhanaPhaseIndex ?? 0) > 0 || (s.sadhanaPhaseProgress ?? 0) > 0
      ? Math.max(1, s.sadhanaPhaseProgress ?? 0)
      : 0;
  return Math.max(s.progressSeconds, guided, phase);
}

export function canSoftSaveAbandon(s: {
  isCompleted: boolean;
  targetDurationSeconds: number;
  progressSeconds: number;
  guidedAudioSeconds?: number;
  sadhanaPhaseIndex?: number;
  sadhanaPhaseProgress?: number;
  timerRunning?: boolean;
}): boolean {
  if (s.isCompleted) return false;
  const elapsed = sessionElapsedSeconds(s);
  if (elapsed <= 0 && !s.timerRunning) return false;
  if (s.targetDurationSeconds <= 0) return true;
  return elapsed / s.targetDurationSeconds < ABANDON_SAVE_PCT;
}

export const useSessionStore = create(
  persist<SessionStore>(
    (set, get) => ({
      ...initial,
      mood: null,
      interrupted: false,

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
          interrupted: false,
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
          interrupted: false,
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
          interrupted: false,
        });
      },

      tick: (progressSeconds) => set({ progressSeconds }),

      complete: () =>
        set({ isCompleted: true, pausedAt: null, timerRunning: false, interrupted: false }),

      reset: () => set({ ...initial, mood: null, interrupted: false }),

      setMood: (mood) => set({ mood }),

      setTimerRunning: (timerRunning) => set({ timerRunning }),

      setSadhanaPhaseState: (sadhanaPhaseIndex, sadhanaPhaseProgress) =>
        set({ sadhanaPhaseIndex, sadhanaPhaseProgress }),

      setGuidedAudioSeconds: (guidedAudioSeconds) => set({ guidedAudioSeconds }),

      markInterrupted: () => {
        const s = get();
        const now = Date.now();
        set({
          interrupted: true,
          timerRunning: false,
          startedAt: s.startedAt ?? now,
          pausedAt: s.pausedAt ?? now,
        });
      },

      clearInterrupted: () => set({ interrupted: false }),
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
          interrupted: state.interrupted,
        }) as SessionStore,
    },
  ),
);
