import bridge from '@vkontakte/vk-bridge';
import { isVkMiniApp } from '@/utils/vk';

export type VkStoreSyncConfig<TSnapshot> = {
  storageKey: string;
  snapshotFromStore: () => TSnapshot;
  applySnapshot: (snap: TSnapshot) => void;
  pickNewer: (local: TSnapshot, remote: TSnapshot) => TSnapshot;
  /** Remote empty → push local only if this is true */
  hasLocalWorthPushing: (local: TSnapshot) => boolean;
  /** After merge, push if local beat remote */
  shouldPushMerged: (merged: TSnapshot, remote: TSnapshot) => boolean;
  waitHydrated: () => Promise<void>;
  subscribeChanged: (onChange: () => void) => () => void;
  isValidSnapshot: (raw: unknown) => raw is TSnapshot;
};

export function createVkStoreSync<TSnapshot>(config: VkStoreSyncConfig<TSnapshot>) {
  let suppressPush = false;
  let pushTimer: ReturnType<typeof setTimeout> | null = null;
  let started = false;

  function withSuppress(fn: () => void) {
    suppressPush = true;
    try {
      fn();
    } finally {
      queueMicrotask(() => {
        suppressPush = false;
      });
    }
  }

  async function hydrate(): Promise<boolean> {
    if (!isVkMiniApp()) return false;
    await config.waitHydrated();
    try {
      const data = await bridge.send('VKWebAppStorageGet', { keys: [config.storageKey] });
      const raw = data.keys?.find((k) => k.key === config.storageKey)?.value;
      if (!raw) {
        const local = config.snapshotFromStore();
        if (config.hasLocalWorthPushing(local)) {
          await push();
        }
        return false;
      }
      const remote = JSON.parse(raw) as unknown;
      if (!config.isValidSnapshot(remote)) return false;
      const local = config.snapshotFromStore();
      const merged = config.pickNewer(local, remote);
      withSuppress(() => config.applySnapshot(merged));
      if (config.shouldPushMerged(merged, remote)) {
        await push();
      }
      return true;
    } catch {
      return false;
    }
  }

  async function push(): Promise<boolean> {
    if (!isVkMiniApp() || suppressPush) return false;
    try {
      const value = JSON.stringify(config.snapshotFromStore());
      if (value.length > 4000) return false;
      await bridge.send('VKWebAppStorageSet', { key: config.storageKey, value });
      return true;
    } catch {
      return false;
    }
  }

  function schedulePush(delayMs = 600) {
    if (!isVkMiniApp() || suppressPush) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushTimer = null;
      void push();
    }, delayMs);
  }

  function start(): () => void {
    if (!isVkMiniApp() || started) return () => undefined;
    started = true;
    void hydrate();
    const unsub = config.subscribeChanged(() => {
      if (suppressPush) return;
      schedulePush();
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

  return { hydrate, push, schedulePush, start, withSuppress };
}
