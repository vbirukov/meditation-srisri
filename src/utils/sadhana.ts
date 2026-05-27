import type { SadhanaBlock, SadhanaPhase, SadhanaPractice } from '@/types';

function blocksById(blocks: readonly SadhanaBlock[]): Record<string, SadhanaBlock> {
  return Object.fromEntries(blocks.map((b) => [b.id, b]));
}

type AudioFields = Pick<
  SadhanaPhase,
  'audioUrl' | 'startAudioUrl' | 'startingAudioUrl' | 'finishingAudioUrl'
>;

function pickMainAudioUrl(...sources: Array<AudioFields | undefined>): string | undefined {
  for (const s of sources) {
    if (!s) continue;
    if (s.audioUrl) return s.audioUrl;
    if (s.startAudioUrl) return s.startAudioUrl;
  }
  return undefined;
}

function pickStartingAudioUrl(...sources: Array<AudioFields | undefined>): string | undefined {
  for (const s of sources) {
    if (!s) continue;
    if (s.startingAudioUrl) return s.startingAudioUrl;
  }
  return undefined;
}

function pickFinishingAudioUrl(...sources: Array<AudioFields | undefined>): string | undefined {
  for (const s of sources) {
    if (!s) continue;
    if (s.finishingAudioUrl) return s.finishingAudioUrl;
  }
  return undefined;
}

function resolveBlock(
  phase: SadhanaPhase,
  byId: Record<string, SadhanaBlock>,
): SadhanaBlock | undefined {
  const ref = phase.blockId ?? phase.preset;
  if (ref) return byId[ref];
  return byId[phase.id];
}

export type ResolvedSadhanaPhase = Required<Pick<SadhanaPhase, 'id' | 'label'>> &
  Pick<SadhanaPhase, 'durationSeconds' | 'audioUrl' | 'startingAudioUrl' | 'finishingAudioUrl'> & {
    sourceBlockId?: string;
  };

export function resolveSadhanaPhases(
  practice: SadhanaPractice,
  blocks: readonly SadhanaBlock[] = [],
): ResolvedSadhanaPhase[] {
  const byId = blocksById(blocks);
  return practice.phases.map((p) => {
    const block = resolveBlock(p, byId);
    if (!block) {
      return {
        id: p.id,
        label: p.label ?? p.id,
        durationSeconds: p.durationSeconds,
        audioUrl: pickMainAudioUrl(p),
        startingAudioUrl: pickStartingAudioUrl(p),
        finishingAudioUrl: pickFinishingAudioUrl(p),
      };
    }
    return {
      id: p.id,
      label: p.label || block.title,
      durationSeconds: p.durationSeconds ?? block.durationSeconds,
      audioUrl: pickMainAudioUrl(p, block),
      startingAudioUrl: pickStartingAudioUrl(p, block),
      finishingAudioUrl: pickFinishingAudioUrl(p, block),
      sourceBlockId: block.id,
    };
  });
}

export function sadhanaTotalSeconds(
  practice: SadhanaPractice,
  blocks: readonly SadhanaBlock[] = [],
): { totalSeconds: number; hasUnknown: boolean } {
  const phases = resolveSadhanaPhases(practice, blocks);
  let total = 0;
  let unknown = false;
  for (const p of phases) {
    if (typeof p.durationSeconds === 'number' && Number.isFinite(p.durationSeconds)) {
      total += p.durationSeconds;
    } else if (p.audioUrl) {
      unknown = true;
    } else {
      unknown = true;
    }
  }
  return { totalSeconds: total, hasUnknown: unknown };
}

export function formatPhaseDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

export function phaseListSummary(phases: SadhanaPhase[]): string {
  return phases
    .map((p) => {
      const s = p.durationSeconds;
      const dur = typeof s === 'number' ? formatPhaseDuration(s) : '—';
      return `${p.label ?? p.id} (${dur})`;
    })
    .join(' · ');
}
