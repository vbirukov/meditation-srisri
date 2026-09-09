import bridge from '@vkontakte/vk-bridge';
import { useRecentPracticeStore } from '@/store/recentPracticeStore';
import type { PracticeTab } from '@/types';
import { isVkMiniApp } from '@/utils/vk';

const STORAGE_KEY = 'recent_practice';

export interface RecentPracticeSnapshot {
  v: 1;
  lastTab: PracticeTab | null;
  lastMeditationId: string | null;
  lastSadhanaId: string | null;
  lastCustomPracticeId: string | null;
  updatedAt: number;
}

let suppressPush = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

function snapshotFromStore(): RecentPracticeSnapshot {
  const s = useRecentPracticeStore.getState();
  return {
    v: 1,
    lastTab: s.lastTab,
    lastMeditationId: s.lastMeditationId,
    lastSadhanaId: s.lastSadhanaId,
    lastCustomPracticeId: s.lastCustomPracticeId,
    updatedAt: s.updatedAt,
  };
}

export function pickNewerRecent(
  local: RecentPracticeSnapshot,
  remote: RecentPracticeSnapshot,
): RecentPracticeSnapshot {
  return (remote.updatedAt ?? 0) > (local.updatedAt ?? 0) ? remote : local;
}

function applySnapshot(snap: RecentPracticeSnapshot) {
  suppressPush = true;
  try {
    useRecentPracticeStore.setState({
      lastTab: snap.lastTab,
      lastMeditationId: snap.lastMeditationId,
      lastSadhanaId: snap.lastSadhanaId,
      lastCustomPracticeId: snap.lastCustomPracticeId,
      updatedAt: snap.updatedAt,
    });
  } finally {
    queueMicrotask(() => {
      suppressPush = false;
    });
  }
}

function waitLocalPersistHydrated(): Promise<void> {
  const api = useRecentPracticeStore.persist;
  if (api.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = api.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

export async function hydrateRecentPracticeFromVk(): Promise<boolean> {
  if (!isVkMiniApp()) return false;
  await waitLocalPersistHydrated();
  try {
    const data = await bridge.send('VKWebAppStorageGet', { keys: [STORAGE_KEY] });
    const raw = data.keys?.find((k) => k.key === STORAGE_KEY)?.value;
    if (!raw) {
      const local = snapshotFromStore();
      if (local.lastTab || local.lastMeditationId || local.lastSadhanaId || local.lastCustomPracticeId) {
        await pushRecentPracticeToVk();
      }
      return false;
    }
    const remote = JSON.parse(raw) as RecentPracticeSnapshot;
    if (remote?.v !== 1) return false;
    const local = snapshotFromStore();
    const merged = pickNewerRecent(local, remote);
    applySnapshot(merged);
    if ((merged.updatedAt ?? 0) > (remote.updatedAt ?? 0)) {
      await pushRecentPracticeToVk();
    }
    return true;
  } catch {
    return false;
  }
}

export async function pushRecentPracticeToVk(): Promise<boolean> {
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

export function schedulePushRecentPracticeToVk(delayMs = 600) {
  if (!isVkMiniApp() || suppressPush) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushRecentPracticeToVk();
  }, delayMs);
}

export function startRecentPracticeVkSync(): () => void {
  if (!isVkMiniApp() || started) return () => undefined;
  started = true;
  void hydrateRecentPracticeFromVk();
  const unsub = useRecentPracticeStore.subscribe((state, prev) => {
    if (suppressPush) return;
    if (
      state.lastTab === prev.lastTab &&
      state.lastMeditationId === prev.lastMeditationId &&
      state.lastSadhanaId === prev.lastSadhanaId &&
      state.lastCustomPracticeId === prev.lastCustomPracticeId &&
      state.updatedAt === prev.updatedAt
    ) {
      return;
    }
    schedulePushRecentPracticeToVk();
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
