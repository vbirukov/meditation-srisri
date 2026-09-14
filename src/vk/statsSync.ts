import {
  usePracticeStatsStore,
  type LastPracticeSession,
} from '@/store/practiceStatsStore';
import { createVkStoreSync } from '@/vk/vkStoreSync';

const STORAGE_KEY = 'practice_stats';

export interface PracticeStatsSnapshot {
  v: 1;
  totalSessions: number;
  streakDays: number;
  lastPracticeDate: string | null;
  monthKey: string;
  secondsThisMonth: number;
  lastSession: LastPracticeSession | null;
}

function snapshotFromStore(): PracticeStatsSnapshot {
  const s = usePracticeStatsStore.getState();
  return {
    v: 1,
    totalSessions: s.totalSessions,
    streakDays: s.streakDays,
    lastPracticeDate: s.lastPracticeDate,
    monthKey: s.monthKey,
    secondsThisMonth: s.secondsThisMonth,
    lastSession: s.lastSession,
  };
}

function completedAt(s: PracticeStatsSnapshot): number {
  return s.lastSession?.completedAt ?? 0;
}

/** ponytail: naive “newer wins”; upgrade = per-field CRDT if conflicts bite */
export function pickNewerSnapshot(
  local: PracticeStatsSnapshot,
  remote: PracticeStatsSnapshot,
): PracticeStatsSnapshot {
  if (completedAt(remote) > completedAt(local)) return remote;
  if (completedAt(local) > completedAt(remote)) return local;
  return remote.totalSessions > local.totalSessions ? remote : local;
}

function applySnapshot(snap: PracticeStatsSnapshot) {
  usePracticeStatsStore.setState({
    totalSessions: snap.totalSessions,
    streakDays: snap.streakDays,
    lastPracticeDate: snap.lastPracticeDate,
    monthKey: snap.monthKey,
    secondsThisMonth: snap.secondsThisMonth,
    lastSession: snap.lastSession,
  });
}

function waitLocalPersistHydrated(): Promise<void> {
  const api = usePracticeStatsStore.persist;
  if (api.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = api.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

function isValidSnapshot(raw: unknown): raw is PracticeStatsSnapshot {
  return typeof raw === 'object' && raw !== null && (raw as PracticeStatsSnapshot).v === 1;
}

const sync = createVkStoreSync<PracticeStatsSnapshot>({
  storageKey: STORAGE_KEY,
  snapshotFromStore,
  applySnapshot,
  pickNewer: pickNewerSnapshot,
  hasLocalWorthPushing: (local) => local.totalSessions > 0 || !!local.lastSession,
  shouldPushMerged: (merged, remote) =>
    completedAt(merged) > completedAt(remote) || merged.totalSessions > remote.totalSessions,
  waitHydrated: waitLocalPersistHydrated,
  subscribeChanged: (onChange) =>
    usePracticeStatsStore.subscribe((state, prev) => {
      if (
        state.totalSessions === prev.totalSessions &&
        state.streakDays === prev.streakDays &&
        state.lastPracticeDate === prev.lastPracticeDate &&
        state.monthKey === prev.monthKey &&
        state.secondsThisMonth === prev.secondsThisMonth &&
        state.lastSession === prev.lastSession
      ) {
        return;
      }
      onChange();
    }),
  isValidSnapshot,
});

export const hydratePracticeStatsFromVk = sync.hydrate;
export const pushPracticeStatsToVk = sync.push;
export const schedulePushPracticeStatsToVk = sync.schedulePush;
export const startPracticeStatsVkSync = sync.start;

/** self-check: fails loud if merge regresses */
export function assertPickNewerWorks() {
  const older: PracticeStatsSnapshot = {
    v: 1,
    totalSessions: 1,
    streakDays: 1,
    lastPracticeDate: '2026-01-01',
    monthKey: '2026-01',
    secondsThisMonth: 60,
    lastSession: {
      mode: 'timer',
      durationSeconds: 60,
      completedAt: 1000,
    },
  };
  const newer = {
    ...older,
    totalSessions: 5,
    lastSession: { ...older.lastSession!, completedAt: 2000 },
  };
  const picked = pickNewerSnapshot(older, newer);
  if (picked.totalSessions !== 5) throw new Error('pickNewerSnapshot broken');
}
