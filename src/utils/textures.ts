import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import textureManifest from '@/data/texture-manifest.json';

export type TexturePool = keyof typeof textureManifest;

const pools = textureManifest as Record<TexturePool, string[]>;

export function getTexturePool(pool: TexturePool): string[] {
  return pools[pool] ?? [];
}

export function pickRandomFromUrls(urls: readonly string[]): string | undefined {
  if (urls.length === 0) return undefined;
  return urls[Math.floor(Math.random() * urls.length)];
}

export function pickTexture(pool: TexturePool): string | undefined {
  return pickRandomFromUrls(getTexturePool(pool));
}

/** @deprecated Prefer pickTexture / usePageTextures — one random texture per pool per page. */
export function textureForKey(pool: TexturePool, key: string): string | undefined {
  const items = getTexturePool(pool);
  if (items.length === 0) return undefined;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % 2147483647;
  }
  return items[hash % items.length];
}

export function pickPageTextures(
  poolList: readonly TexturePool[],
): Partial<Record<TexturePool, string>> {
  const result: Partial<Record<TexturePool, string>> = {};
  for (const pool of poolList) {
    const url = pickTexture(pool);
    if (url) result[pool] = url;
  }
  return result;
}

export function usePageTextures(
  poolList: readonly TexturePool[],
): Partial<Record<TexturePool, string>> {
  const poolsKey = poolList.join('|');
  return useMemo(() => pickPageTextures(poolList), [poolsKey]);
}

export const PRACTICE_HUB_TEXTURE_POOLS = [
  'meditation-card',
  'sadhana-card',
  'section-header',
  'practice-tools',
] as const satisfies readonly TexturePool[];

export const END_SCREEN_TEXTURE_POOLS = [
  'end-screen',
  'end-hero',
  'end-summary',
  'end-stats',
  'end-mood',
] as const satisfies readonly TexturePool[];

export const SESSION_PANEL_TEXTURE_FALLBACKS = [
  'session-chrome',
  'end-summary',
  'end-stats',
  'practice-tools',
] as const satisfies readonly TexturePool[];

export function pickTextureWithFallback(
  ...poolList: readonly TexturePool[]
): string | undefined {
  for (const pool of poolList) {
    const url = pickTexture(pool);
    if (url) return url;
  }
  return undefined;
}

export function useSessionPanelTexture(): string | undefined {
  return useMemo(
    () => pickTextureWithFallback(...SESSION_PANEL_TEXTURE_FALLBACKS),
    [],
  );
}

export function textureStyle(url?: string): CSSProperties | undefined {
  if (!url) return undefined;
  return { '--texture-image': `url(${url})` } as CSSProperties;
}

export function withTexture(base: string, url?: string, ...modifiers: string[]): string {
  if (!url) return base;
  return [base, 'textured-surface', ...modifiers].join(' ');
}
