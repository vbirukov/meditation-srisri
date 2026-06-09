import offlineManifest from '@/data/offline-manifest.json';
import meditationsData from '@/data/meditations.json';
import sadhanaData from '@/data/sadhana.json';
import type { CustomPractice, Meditation, SadhanaBlock, SadhanaPractice } from '@/types';
import { resolveCustomPracticeSteps } from '@/utils/customPractice';
import { collectPhaseMediaUrls, sadhanaPracticeAllMediaUrls } from '@/utils/sadhana';

export const USER_OFFLINE_CACHE = 'meditate-offline-user-v1';

const meditations = meditationsData as Meditation[];
const sadhanaBlocks = (sadhanaData as { blocks?: SadhanaBlock[] }).blocks ?? [];
const defaultPrecache = new Set(offlineManifest.precacheUrls as string[]);
const buildReadySadhana = new Set(offlineManifest.offlineReadyPracticeIds as string[]);

export function getDefaultPrecacheUrls(): string[] {
  return [...defaultPrecache];
}

export function getDefaultVideoUrls(): string[] {
  return offlineManifest.videoUrls as string[];
}

export function getOfflineDownloadBundleUrls(): string[] {
  return getDefaultPrecacheUrls();
}

export function meditationMediaUrls(m: Meditation): string[] {
  return m.mediaUrl ? [m.mediaUrl] : [];
}

export function customPracticeMediaUrls(
  practice: CustomPractice,
  blocks: readonly SadhanaBlock[] = sadhanaBlocks,
): string[] {
  return collectPhaseMediaUrls(resolveCustomPracticeSteps(practice, blocks));
}

export function isBuildOfflineReadySadhana(practiceId: string): boolean {
  return buildReadySadhana.has(practiceId);
}

export async function isUrlCached(url: string): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const hit = await cache.match(url);
    if (hit) return true;
  }
  return false;
}

export async function areAllUrlsCached(urls: readonly string[]): Promise<boolean> {
  if (urls.length === 0) return true;
  const checks = await Promise.all(urls.map(isUrlCached));
  return checks.every(Boolean);
}

export async function isMeditationOfflineReady(m: Meditation): Promise<boolean> {
  const urls = meditationMediaUrls(m);
  if (urls.length === 0) return false;
  if (urls.every((u) => defaultPrecache.has(u))) {
    return areAllUrlsCached(urls);
  }
  return areAllUrlsCached(urls);
}

export async function isSadhanaOfflineReady(
  practice: SadhanaPractice,
  blocks: readonly SadhanaBlock[] = sadhanaBlocks,
): Promise<boolean> {
  const urls = sadhanaPracticeAllMediaUrls(practice, blocks);
  if (urls.length === 0) return true;
  if (isBuildOfflineReadySadhana(practice.id) && urls.every((u) => defaultPrecache.has(u))) {
    return areAllUrlsCached(urls);
  }
  return areAllUrlsCached(urls);
}

export async function isCustomPracticeOfflineReady(
  practice: CustomPractice,
  blocks: readonly SadhanaBlock[] = sadhanaBlocks,
): Promise<boolean> {
  const urls = customPracticeMediaUrls(practice, blocks);
  return areAllUrlsCached(urls);
}

export type OfflineCacheProgress = {
  done: number;
  total: number;
  currentUrl?: string;
};

export async function cacheUrlsForOffline(
  urls: readonly string[],
  onProgress?: (p: OfflineCacheProgress) => void,
): Promise<{ cached: number; failed: string[] }> {
  const unique = [...new Set(urls)];
  const cache = await caches.open(USER_OFFLINE_CACHE);
  const failed: string[] = [];
  let cached = 0;

  for (let i = 0; i < unique.length; i++) {
    const url = unique[i]!;
    onProgress?.({ done: i, total: unique.length, currentUrl: url });

    const existing = await cache.match(url);
    if (existing) {
      cached += 1;
      continue;
    }

    let already = false;
    const names = await caches.keys();
    for (const name of names) {
      if (name === USER_OFFLINE_CACHE) continue;
      const c = await caches.open(name);
      if (await c.match(url)) {
        already = true;
        break;
      }
    }
    if (already) {
      cached += 1;
      continue;
    }

    try {
      const res = await fetch(url, { cache: 'reload' });
      if (!res.ok) throw new Error(String(res.status));
      await cache.put(url, res.clone());
      cached += 1;
    } catch {
      failed.push(url);
    }
  }

  onProgress?.({ done: unique.length, total: unique.length });
  return { cached, failed };
}

export async function scanOfflineCatalog(): Promise<{
  meditationIds: Set<string>;
  sadhanaIds: Set<string>;
  customPracticeIds: Set<string>;
}> {
  const meditationIds = new Set<string>();
  const sadhanaIds = new Set<string>();
  const customPracticeIds = new Set<string>();

  await Promise.all(
    meditations.map(async (m) => {
      if (await isMeditationOfflineReady(m)) meditationIds.add(m.id);
    }),
  );

  const practices = (sadhanaData as { practices?: SadhanaPractice[] }).practices ?? [];
  await Promise.all(
    practices.map(async (p) => {
      if (await isSadhanaOfflineReady(p)) sadhanaIds.add(p.id);
    }),
  );

  return { meditationIds, sadhanaIds, customPracticeIds };
}
