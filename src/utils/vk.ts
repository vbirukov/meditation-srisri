export const VK_APP_ID = 7595020;
export const VK_APP_URL = `https://vk.com/app${VK_APP_ID}`;

const VK_HOSTS = new Set(['vk.aolapp.ru']);

export function isVkMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  if (VK_HOSTS.has(window.location.hostname)) return true;
  const q = window.location.search;
  if (/(?:^|[?&])vk_app_id=/.test(q)) return true;
  return window.parent !== window && /(?:^|[?&#])vk_/.test(q + window.location.hash);
}

/** Абсолютный URL ассета на публичном домене (для сторис VK). */
export function absoluteMediaUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const origin =
    typeof window !== 'undefined' && window.location.hostname.endsWith('aolapp.ru')
      ? window.location.origin
      : 'https://aolapp.ru';
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
