import { useRecentPracticeStore } from '@/store/recentPracticeStore';
import type { PracticeTab } from '@/types';
import { createVkStoreSync } from '@/vk/vkStoreSync';

const STORAGE_KEY = 'recent_practice';

export interface RecentPracticeSnapshot {
  v: 1;
  lastTab: PracticeTab | null;
  lastMeditationId: string | null;
  lastSadhanaId: string | null;
  lastCustomPracticeId: string | null;
  updatedAt: number;
}

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
  useRecentPracticeStore.setState({
    lastTab: snap.lastTab,
    lastMeditationId: snap.lastMeditationId,
    lastSadhanaId: snap.lastSadhanaId,
    lastCustomPracticeId: snap.lastCustomPracticeId,
    updatedAt: snap.updatedAt,
  });
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

function isValidSnapshot(raw: unknown): raw is RecentPracticeSnapshot {
  return typeof raw === 'object' && raw !== null && (raw as RecentPracticeSnapshot).v === 1;
}

const sync = createVkStoreSync<RecentPracticeSnapshot>({
  storageKey: STORAGE_KEY,
  snapshotFromStore,
  applySnapshot,
  pickNewer: pickNewerRecent,
  hasLocalWorthPushing: (local) =>
    !!(local.lastTab || local.lastMeditationId || local.lastSadhanaId || local.lastCustomPracticeId),
  shouldPushMerged: (merged, remote) => (merged.updatedAt ?? 0) > (remote.updatedAt ?? 0),
  waitHydrated: waitLocalPersistHydrated,
  subscribeChanged: (onChange) =>
    useRecentPracticeStore.subscribe((state, prev) => {
      if (
        state.lastTab === prev.lastTab &&
        state.lastMeditationId === prev.lastMeditationId &&
        state.lastSadhanaId === prev.lastSadhanaId &&
        state.lastCustomPracticeId === prev.lastCustomPracticeId &&
        state.updatedAt === prev.updatedAt
      ) {
        return;
      }
      onChange();
    }),
  isValidSnapshot,
});

export const hydrateRecentPracticeFromVk = sync.hydrate;
export const pushRecentPracticeToVk = sync.push;
export const schedulePushRecentPracticeToVk = sync.schedulePush;
export const startRecentPracticeVkSync = sync.start;
