import { describe, expect, it } from 'vitest';
import { splitRecent } from '@/utils/recentPractice';
import { pickNewerRecent, type RecentPracticeSnapshot } from '@/vk/recentSync';

describe('restore recent practice', () => {
  it('splitRecent extracts the last meditation and leaves the rest', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const { recent, rest } = splitRecent(items, 'b');
    expect(recent?.id).toBe('b');
    expect(rest.map((x) => x.id)).toEqual(['a', 'c']);
  });

  it('splitRecent is a no-op when id missing', () => {
    const items = [{ id: 'a' }];
    expect(splitRecent(items, 'z')).toEqual({ recent: null, rest: items });
  });

  it('pickNewerRecent keeps the fresher snapshot', () => {
    const older: RecentPracticeSnapshot = {
      v: 1,
      lastTab: 'meditations',
      lastMeditationId: 'om-short',
      lastSadhanaId: null,
      lastCustomPracticeId: null,
      updatedAt: 100,
    };
    const newer = { ...older, lastMeditationId: 'smile', updatedAt: 200 };
    expect(pickNewerRecent(older, newer).lastMeditationId).toBe('smile');
    expect(pickNewerRecent(newer, older).lastMeditationId).toBe('smile');
  });
});
