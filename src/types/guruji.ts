import type { SessionMode } from '@/types';

export interface LocalizedText {
  ru: string;
  en: string;
}

export interface GurujiQuote {
  id: string;
  text: LocalizedText;
  source?: Partial<LocalizedText>;
}

export interface GurujiContent {
  media: {
    photo?: string;
    photos?: string[];
    video?: string | null;
  };
  summaries: {
    default: LocalizedText;
    byMode?: Partial<Record<SessionMode, LocalizedText>>;
    byMeditationId?: Record<string, LocalizedText>;
    bySadhanaId?: Record<string, LocalizedText>;
  };
}
