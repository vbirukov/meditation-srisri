export type MeditationType = 'audio' | 'video';

export type BackgroundScene = 'ganga' | 'sea' | 'none';

export type MeditationLanguage = 'en' | 'ru' | 'hi' | 'multi';

export interface Meditation {
  id: string;
  type: MeditationType;
  title: string;
  description?: string;
  durationSeconds: number;
  mediaUrl: string;
  backgroundScene?: BackgroundScene;
  isOfflinePrecached?: boolean;
  language: MeditationLanguage;
}

export type SessionMode = 'guided' | 'timer' | 'custom' | 'sadhana' | 'custom-practice';

export type PracticeTab = 'meditations' | 'sadhana';

export interface SadhanaPhase {
  id: string;
  label?: string;
  durationSeconds?: number;
  audioUrl?: string;
  /** Основной трек фазы (alias в JSON: `startAudioUrl`) */
  startAudioUrl?: string;
  startingAudioUrl?: string;
  finishingAudioUrl?: string;
  /**
   * Ссылка на переиспользуемый блок из `sadhana.json` (alias: `preset`).
   * Если указано — параметры аудио/длительности берутся из блока.
   */
  blockId?: string;
  preset?: string;
}

export interface SadhanaPractice {
  id: string;
  title: string;
  description?: string;
  phases: SadhanaPhase[];
}

export interface SadhanaBlock {
  id: string;
  title: string;
  description?: string;
  audioUrl?: string;
  /** Основной трек фазы (alias в JSON: `startAudioUrl`) */
  startAudioUrl?: string;
  startingAudioUrl?: string;
  durationSeconds?: number;
  finishingAudioUrl?: string;
}

export interface SadhanaCatalog {
  practices: SadhanaPractice[];
  blocks: SadhanaBlock[];
}

/** Шаг пользовательской практики (экземпляр блока из каталога). */
export interface CustomPracticeStep {
  instanceId: string;
  blockId: string;
  label?: string;
  description?: string;
  durationSeconds?: number;
  /** false — не проигрывать, даже если есть в блоке */
  playMainAudio?: boolean;
  playStartingAudio?: boolean;
  playFinishingAudio?: boolean;
}

export interface CustomPractice {
  id: string;
  title: string;
  description?: string;
  steps: CustomPracticeStep[];
  updatedAt: number;
  /** Черновик в конструкторе — не показывается в списке сохранённых до «Сохранить». */
  isDraft?: boolean;
}

export interface MeditationSession {
  mode: SessionMode;
  meditationId?: string;
  sadhanaId?: string;
  customPracticeId?: string;
  targetDurationSeconds: number;
  startedAt: number | null;
  pausedAt: number | null;
  progressSeconds: number;
  isCompleted: boolean;
}

export type VideoScene = 'welcome' | 'picker' | 'session';

export type Locale = 'en' | 'ru';

export type MoodId = 'calm' | 'grateful' | 'peaceful' | 'energized' | 'tired';
