export const SADHANA_DEBUG_STORAGE_KEY = 'meditate-sadhana-debug';
export const SADHANA_DEBUG_PHASE_CAP_SEC = 5;

export function readSadhanaDebugFromStorage(): boolean {
  try {
    return localStorage.getItem(SADHANA_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSadhanaDebugInStorage(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(SADHANA_DEBUG_STORAGE_KEY, '1');
    else localStorage.removeItem(SADHANA_DEBUG_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function readSadhanaDebugFromSearch(params: URLSearchParams): boolean {
  const v = params.get('debug');
  return v === '1' || v === 'true';
}

export function debugPhaseTargetSeconds(
  debug: boolean,
  durationSeconds: number | undefined,
  audioDuration: number | undefined,
): number | null {
  const natural =
    typeof durationSeconds === 'number' && Number.isFinite(durationSeconds)
      ? durationSeconds
      : typeof audioDuration === 'number' && audioDuration > 0
        ? audioDuration
        : null;

  if (!debug) return natural;
  if (natural == null) return SADHANA_DEBUG_PHASE_CAP_SEC;
  return Math.min(natural, SADHANA_DEBUG_PHASE_CAP_SEC);
}

export type PhaseAudioFlags = {
  main: boolean;
  starting: boolean;
  finishing: boolean;
};

export function phaseAudioFlags(phase: {
  audioUrl?: string;
  startingAudioUrl?: string;
  finishingAudioUrl?: string;
}): PhaseAudioFlags {
  return {
    main: Boolean(phase.audioUrl),
    starting: Boolean(phase.startingAudioUrl),
    finishing: Boolean(phase.finishingAudioUrl),
  };
}
