export interface GurujiQuoteEntry {
  id: number;
  text: string;
  language: 'ru' | 'en';
  tags: readonly string[];
}

export declare const SRI_SRI_RAVI_SHANKAR_QUOTES: readonly GurujiQuoteEntry[];
