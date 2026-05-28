import { useEffect } from 'react';

let activeLock: WakeLockSentinel | null = null;

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

/** Вызывать из обработчика клика (iOS требует user gesture). */
export async function acquireScreenWakeLock(): Promise<void> {
  if (!isWakeLockSupported()) return;
  if (activeLock && !activeLock.released) return;

  try {
    activeLock = await navigator.wakeLock.request('screen');
    activeLock.addEventListener('release', () => {
      if (activeLock?.released) activeLock = null;
    });
  } catch {
    activeLock = null;
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  if (!activeLock) return;
  try {
    await activeLock.release();
  } catch {
    /* already released */
  }
  activeLock = null;
}

export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      void releaseScreenWakeLock();
      return;
    }

    void acquireScreenWakeLock();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquireScreenWakeLock();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void releaseScreenWakeLock();
    };
  }, [enabled]);
}
