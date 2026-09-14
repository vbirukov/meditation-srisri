import { VK_APP_ID, VK_APP_URL, isVkMiniApp } from '@/utils/vk';

export type ShareChannel = 'wall' | 'story' | 'link' | 'invite';

export type PracticeDeepLink = {
  meditationId?: string;
  sadhanaId?: string;
  timer?: boolean;
  /** Attribution channel that produced this open */
  ref?: string;
};

const FIRST_REF_KEY = 'meditate-share-ref-first';
const SESSION_REF_KEY = 'meditate-share-ref';

/** Parse practice deep-link from a query string (`m` / `s` / `t` / `ref`). */
export function parsePracticeDeepLink(
  search: string | URLSearchParams,
): PracticeDeepLink {
  const q = typeof search === 'string' ? new URLSearchParams(search.replace(/^\?/, '')) : search;
  const meditationId = q.get('m')?.trim() || undefined;
  const sadhanaId = q.get('s')?.trim() || undefined;
  const timer = q.get('t') === '1' || q.get('mode') === 'timer';
  const ref = q.get('ref')?.trim() || undefined;
  return {
    meditationId,
    sadhanaId,
    timer: timer || undefined,
    ref,
  };
}

/** In-app path for HashRouter / BrowserRouter. */
export function buildPracticeDeepLinkPath(link: PracticeDeepLink): string {
  const q = new URLSearchParams();
  if (link.meditationId) q.set('m', link.meditationId);
  if (link.sadhanaId) q.set('s', link.sadhanaId);
  if (link.timer) q.set('t', '1');
  if (link.ref) q.set('ref', link.ref);
  if (link.sadhanaId) {
    q.set('tab', 'sadhana');
    q.set('setup', '1');
  } else if (link.timer) {
    q.set('setup', '1');
  }
  const full = q.toString();
  return full ? `/session?${full}` : '/session';
}

/** Absolute share URL: VK hash deep-link or PWA path. */
export function buildShareAppUrl(link: PracticeDeepLink): string {
  const path = buildPracticeDeepLinkPath(link);
  if (isVkMiniApp() || typeof window === 'undefined') {
    return `${VK_APP_URL}#${path}`;
  }
  if (window.location.hostname.endsWith('aolapp.ru')) {
    return `${window.location.origin}${path}`;
  }
  return `${VK_APP_URL}#${path}`;
}

/** Read ref from current location (search + hash query). */
export function readLocationShareRef(): string | null {
  if (typeof window === 'undefined') return null;
  const fromSearch = new URLSearchParams(window.location.search).get('ref');
  if (fromSearch) return fromSearch;
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    return new URLSearchParams(hash.slice(qIndex + 1)).get('ref');
  }
  return null;
}

/** Persist first-touch + session attribution; returns first-touch ref. */
export function captureShareAttribution(ref?: string | null): string | null {
  if (typeof window === 'undefined') return null;
  const incoming = ref ?? readLocationShareRef();
  if (incoming) {
    try {
      sessionStorage.setItem(SESSION_REF_KEY, incoming);
      if (!localStorage.getItem(FIRST_REF_KEY)) {
        localStorage.setItem(FIRST_REF_KEY, incoming);
      }
    } catch {
      /* private mode */
    }
  }
  try {
    return localStorage.getItem(FIRST_REF_KEY) ?? sessionStorage.getItem(SESSION_REF_KEY);
  } catch {
    return incoming;
  }
}

export function getShareAttribution(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      sessionStorage.getItem(SESSION_REF_KEY) ?? localStorage.getItem(FIRST_REF_KEY)
    );
  } catch {
    return null;
  }
}

export function deepLinkFromLastSession(opts: {
  meditationId?: string;
  sadhanaId?: string;
  mode?: string;
  channel: ShareChannel;
}): PracticeDeepLink {
  const link: PracticeDeepLink = { ref: opts.channel };
  if (opts.meditationId) link.meditationId = opts.meditationId;
  else if (opts.sadhanaId) link.sadhanaId = opts.sadhanaId;
  else if (opts.mode === 'timer') link.timer = true;
  return link;
}

/** @internal test helper — app id in URL */
export function vkAppUrlForTests() {
  return `https://vk.com/app${VK_APP_ID}`;
}
