import type { Meditation, MeditationLanguage } from '@/types';

export type ContentLangFilter = 'all' | MeditationLanguage;

export const CONTENT_LANG_FILTERS: ContentLangFilter[] = ['all', 'ru', 'en', 'hi', 'multi'];

/** Content language is independent of UI locale. */
export function matchesContentLanguage(
  m: Pick<Meditation, 'language'>,
  filter: ContentLangFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'multi') return m.language === 'multi';
  // multi content is shown for any specific language filter
  return m.language === filter || m.language === 'multi';
}

export function filterMeditationsByContentLang<T extends Pick<Meditation, 'language'>>(
  list: readonly T[],
  filter: ContentLangFilter,
): T[] {
  return list.filter((m) => matchesContentLanguage(m, filter));
}
