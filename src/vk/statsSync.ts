import bridge from '@vkontakte/vk-bridge';
import {
  usePracticeStatsStore,
  type LastPracticeSession,
} from '@/store/practiceStatsStore';
import { isVkMiniApp } from '@/utils/vk';

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

let suppressPush = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

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
  suppressPush = true;
  try {
    usePracticeStatsStore.setState({
      totalSessions: snap.totalSessions,
      streakDays: snap.streakDays,
      lastPracticeDate: snap.lastPracticeDate,
      monthKey: snap.monthKey,
      secondsThisMonth: snap.secondsThisMonth,
      lastSession: snap.lastSession,
    });
  } finally {
    // persist middleware пишет sync; отпускаем на следующем тике
    queueMicrotask(() => {
      suppressPush = false;
    });
  }
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

export async function hydratePracticeStatsFromVk(): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  await waitLocalPersistHydrated();
  try {
    const data = await bridge.send('VKWebAppStorageGet', { keys: [STORAGE_KEY] });
    const raw = data.keys?.find((k) => k.key === STORAGE_KEY)?.value;
    if (!raw) {
      // в VK ещё пусто — зальём локальное, если есть прогресс
      const local = snapshotFromStore();
      if (local.totalSessions > 0 || local.lastSession) {
        await pushPracticeStatsToVk();
      }
      return false;
    }
    const remote = JSON.parse(raw) as PracticeStatsSnapshot;
    if (remote?.v !== 1) return false;
    const local = snapshotFromStore();
    const merged = pickNewerSnapshot(local, remote);
    applySnapshot(merged);
    if (completedAt(merged) > completedAt(remote) || merged.totalSessions > remote.totalSessions) {
      await pushPracticeStatsToVk();
    }
    return true;
  } catch {
    return false;
  }
}

export async function pushPracticeStatsToVk(): Promise<boolean> {
  if (!isVkMiniApp() || suppressPush) return false;
  try {
    const value = JSON.stringify(snapshotFromStore());
    if (value.length > 4000) return false;
    await bridge.send('VKWebAppStorageSet', { key: STORAGE_KEY, value });
    return true;
  } catch {
    return false;
  }
}

export function schedulePushPracticeStatsToVk(delayMs = 600) {
  if (!isVkMiniApp() || suppressPush) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushPracticeStatsToVk();
  }, delayMs);
}

/** Старт sync: hydrate → подписка на изменения store */
export function startPracticeStatsVkSync(): () => void {
  if (!isVkMiniApp() || started) return () => undefined;
  started = true;
  void hydratePracticeStatsFromVk();
  const unsub = usePracticeStatsStore.subscribe((state, prev) => {
    if (suppressPush) return;
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
    schedulePushPracticeStatsToVk();
  });
  return () => {
    unsub();
    started = false;
    if (pushTimer) {
      clearTimeout(pushTimer);
      pushTimer = null;
    }
  };
}

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
