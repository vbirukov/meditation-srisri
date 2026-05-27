import gurujiContent from '@/data/guruji-content.json';
import type { GurujiContent, GurujiQuote, LocalizedText } from '@/types/guruji';
import type { Locale, SessionMode } from '@/types';

const content = gurujiContent as GurujiContent;

export function getGurujiMedia() {
  return content.media;
}

function pickFromList(items: string | string[] | undefined): string | undefined {
  if (!items) return undefined;
  if (typeof items === 'string') return items;
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function pickPhoto(): string | undefined {
  const { media } = content;
  return pickFromList(media.photos ?? media.photo);
}

export function pickQuote(): GurujiQuote {
  const { quotes } = content;
  if (quotes.length === 0) {
    return {
      id: 'fallback',
      text: { ru: '', en: '' },
    };
  }
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getLocalized(text: LocalizedText | Partial<LocalizedText>, locale: Locale): string {
  return text[locale] ?? text.ru ?? text.en ?? '';
}

export function getSessionSummary(
  mode: SessionMode,
  meditationId: string | undefined,
  locale: Locale,
  sadhanaId?: string,
): string {
  const { summaries } = content;
  if (sadhanaId && summaries.bySadhanaId?.[sadhanaId]) {
    return getLocalized(summaries.bySadhanaId[sadhanaId], locale);
  }
  if (meditationId && summaries.byMeditationId?.[meditationId]) {
    return getLocalized(summaries.byMeditationId[meditationId], locale);
  }
  if (summaries.byMode?.[mode]) {
    return getLocalized(summaries.byMode[mode], locale);
  }
  return getLocalized(summaries.default, locale);
}
