import { describe, expect, it } from 'vitest';
import { filterMeditationsByContentLang, matchesContentLanguage } from '@/utils/contentLanguage';

describe('content language filter', () => {
  it('all keeps everything', () => {
    expect(matchesContentLanguage({ language: 'hi' }, 'all')).toBe(true);
  });

  it('specific lang includes multi', () => {
    expect(matchesContentLanguage({ language: 'multi' }, 'ru')).toBe(true);
    expect(matchesContentLanguage({ language: 'en' }, 'ru')).toBe(false);
    expect(matchesContentLanguage({ language: 'ru' }, 'ru')).toBe(true);
  });

  it('filters lists', () => {
    const list = [{ language: 'ru' as const }, { language: 'hi' as const }, { language: 'multi' as const }];
    expect(filterMeditationsByContentLang(list, 'hi').map((m) => m.language)).toEqual([
      'hi',
      'multi',
    ]);
  });
});
