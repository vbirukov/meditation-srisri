import { isVkMiniApp } from '@/utils/vk';

export type TrackProps = Record<string, string | number | boolean | null | undefined>;

export type TrackEvent =
  | 'app_open'
  | 'welcome_cta'
  | 'onboarding_view'
  | 'onboarding_start'
  | 'onboarding_skip'
  | 'practice_hub_view'
  | 'session_start'
  | 'session_progress_50'
  | 'session_complete'
  | 'session_abandon'
  | 'end_share'
  | 'share_open'
  | 'vk_notifications'
  | 'offline_download'
  | 'custom_practice_save';

type YmFn = ((...args: unknown[]) => void) & { a?: unknown[][] };

declare global {
  interface Window {
    ym?: YmFn;
  }
}

/** Must match counter in index.html */
const YM_ID = Number(import.meta.env.VITE_YM_ID) || 112459633;

function channel(): 'vk' | 'pwa' {
  return isVkMiniApp() ? 'vk' : 'pwa';
}

function pixel(name: TrackEvent, props: TrackProps) {
  try {
    const q = new URLSearchParams();
    q.set('n', name);
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null) continue;
      q.set(k, String(v));
    }
    const img = new Image(1, 1);
    img.referrerPolicy = 'no-referrer';
    img.src = `/e.gif?${q.toString()}`;
  } catch {
    /* fail open */
  }
}

function reachGoal(name: TrackEvent, props: TrackProps) {
  const fire = () => {
    try {
      window.ym?.(YM_ID, 'reachGoal', name, props);
    } catch {
      /* fail open */
    }
  };
  if (typeof window.ym === 'function') {
    fire();
    return;
  }
  // tag.js from index.html still loading
  window.setTimeout(fire, 800);
}

/** Единая точка продуктовой аналитики. Метрика (index.html) + пиксель /e.gif. */
export function track(name: TrackEvent, props: TrackProps = {}): void {
  const payload: TrackProps = { channel: channel(), ...props };

  if (import.meta.env.DEV) {
    console.debug('[track]', name, payload);
  }

  pixel(name, payload);
  reachGoal(name, payload);
}
