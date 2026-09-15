import { describe, expect, it } from 'vitest';
import { getCuratedOfflineVideoUrls, getOfflineDownloadBundleUrls } from '@/utils/offlineMedia';

describe('offline curation', () => {
  it('default pack is audio precache; curated videos empty until configured', () => {
    expect(getCuratedOfflineVideoUrls()).toEqual([]);
    expect(getOfflineDownloadBundleUrls().length).toBeGreaterThan(0);
    expect(getOfflineDownloadBundleUrls().every((u) => !u.includes('/video/meditations/'))).toBe(
      true,
    );
  });
});
