import type {
  SadhanaBlock,
  SadhanaPhase,
  SadhanaPhaseAlternative,
  SadhanaPhaseSlot,
  SadhanaPractice,
} from '@/types';

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

export function getPhaseAlternativeIds(phase: SadhanaPhase): string[] | null {
  if (phase.alternatives?.length) {
    const ids = [...phase.alternatives];
    if (phase.id && !ids.includes(phase.id)) ids.unshift(phase.id);
    return ids;
  }
  if (phase.altId) {
    const ids = phase.id ? [phase.id] : [];
    if (!ids.includes(phase.altId)) ids.push(phase.altId);
    return ids.length > 1 ? ids : null;
  }
  return null;
}

function resolveBlockRef(phase: SadhanaPhase): string {
  return phase.blockId ?? phase.preset ?? phase.id;
}

function resolveSingleBlock(
  block: SadhanaBlock,
  overrides: SadhanaPhase,
): ResolvedSadhanaPhase {
  return {
    id: overrides.id || block.id,
    label: overrides.label || block.title,
    durationSeconds: overrides.durationSeconds ?? block.durationSeconds,
    audioUrl: pickMainAudioUrl(overrides, block),
    startingAudioUrl: pickStartingAudioUrl(overrides, block),
    finishingAudioUrl: pickFinishingAudioUrl(overrides, block),
    sourceBlockId: block.id,
  };
}

export type ResolvedSadhanaPhase = Required<Pick<SadhanaPhase, 'id' | 'label'>> &
  Pick<SadhanaPhase, 'durationSeconds' | 'audioUrl' | 'startingAudioUrl' | 'finishingAudioUrl'> & {
    sourceBlockId?: string;
    slotIndex?: number;
  };

export function expandBlockPhases(
  blockId: string,
  byId: Record<string, SadhanaBlock>,
  overrides: SadhanaPhase = { id: blockId },
  visited = new Set<string>(),
): ResolvedSadhanaPhase[] {
  const block = byId[blockId];
  if (!block) {
    return [
      {
        id: overrides.id || blockId,
        label: overrides.label ?? blockId,
        durationSeconds: overrides.durationSeconds,
        audioUrl: pickMainAudioUrl(overrides),
        startingAudioUrl: pickStartingAudioUrl(overrides),
        finishingAudioUrl: pickFinishingAudioUrl(overrides),
        sourceBlockId: blockId,
      },
    ];
  }

  const subIds = block.includes?.blocks;
  if (subIds?.length) {
    if (visited.has(blockId)) return [resolveSingleBlock(block, overrides)];
    visited.add(blockId);

    const expanded: ResolvedSadhanaPhase[] = [];
    for (const subId of subIds) {
      expanded.push(...expandBlockPhases(subId, byId, { id: subId }, visited));
    }

    if (block.finishingAudioUrl && expanded.length > 0) {
      const last = expanded[expanded.length - 1]!;
      last.finishingAudioUrl =
        pickFinishingAudioUrl(overrides, block) ?? last.finishingAudioUrl;
    }

    visited.delete(blockId);
    return expanded;
  }

  return [resolveSingleBlock(block, overrides)];
}

function buildAlternativeMeta(
  blockIds: string[],
  byId: Record<string, SadhanaBlock>,
): SadhanaPhaseAlternative[] {
  return blockIds.map((blockId) => {
    const block = byId[blockId];
    return {
      blockId,
      label: block?.title ?? blockId,
      description: block?.description,
    };
  });
}

function slotDuration(
  phases: ResolvedSadhanaPhase[],
): { durationSeconds?: number; hasUnknown: boolean } {
  let total = 0;
  let hasUnknown = false;
  for (const p of phases) {
    if (typeof p.durationSeconds === 'number' && Number.isFinite(p.durationSeconds)) {
      total += p.durationSeconds;
    } else if (p.audioUrl) {
      hasUnknown = true;
    } else {
      hasUnknown = true;
    }
  }
  return { durationSeconds: hasUnknown ? undefined : total, hasUnknown };
}

export interface ResolvedSadhanaPractice {
  phases: ResolvedSadhanaPhase[];
  slots: SadhanaPhaseSlot[];
}

export function resolveSadhanaPractice(
  practice: SadhanaPractice,
  blocks: readonly SadhanaBlock[] = [],
  blockChoices: Record<number, string> = {},
): ResolvedSadhanaPractice {
  const byId = blocksById(blocks);
  const phases: ResolvedSadhanaPhase[] = [];
  const slots: SadhanaPhaseSlot[] = [];

  practice.phases.forEach((phase, slotIndex) => {
    const altIds = getPhaseAlternativeIds(phase);
    const selectedBlockId =
      (altIds && blockChoices[slotIndex]) || (altIds ? altIds[0]! : resolveBlockRef(phase));

    const expanded = expandBlockPhases(selectedBlockId, byId, {
      ...phase,
      id: phase.id || selectedBlockId,
    }).map((p) => ({ ...p, slotIndex }));

    phases.push(...expanded);

    const { durationSeconds, hasUnknown } = slotDuration(expanded);
    const primaryLabel =
      expanded.length === 1
        ? expanded[0]!.label
        : (byId[selectedBlockId]?.title ?? selectedBlockId);

    slots.push({
      slotIndex,
      label: phase.label ?? primaryLabel,
      durationSeconds,
      hasUnknownDuration: hasUnknown,
      alternatives: altIds ? buildAlternativeMeta(altIds, byId) : undefined,
      selectedBlockId,
      phaseCount: expanded.length,
    });
  });

  return { phases, slots };
}

export function resolveSadhanaPhases(
  practice: SadhanaPractice,
  blocks: readonly SadhanaBlock[] = [],
  blockChoices: Record<number, string> = {},
): ResolvedSadhanaPhase[] {
  return resolveSadhanaPractice(practice, blocks, blockChoices).phases;
}

export function sadhanaTotalSeconds(
  practice: SadhanaPractice,
  blocks: readonly SadhanaBlock[] = [],
  blockChoices: Record<number, string> = {},
): { totalSeconds: number; hasUnknown: boolean } {
  const { phases } = resolveSadhanaPractice(practice, blocks, blockChoices);
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

export function collectPhaseMediaUrls(
  phases: ReadonlyArray<
    Pick<SadhanaPhase, 'audioUrl' | 'startingAudioUrl' | 'finishingAudioUrl'>
  >,
): string[] {
  const urls: string[] = [];
  for (const p of phases) {
    if (p.audioUrl) urls.push(p.audioUrl);
    if (p.startingAudioUrl) urls.push(p.startingAudioUrl);
    if (p.finishingAudioUrl) urls.push(p.finishingAudioUrl);
  }
  return [...new Set(urls)];
}

function collectBlockMediaUrls(
  blockId: string,
  byId: Record<string, SadhanaBlock>,
  visited = new Set<string>(),
): string[] {
  const block = byId[blockId];
  if (!block) return [];

  const subIds = block.includes?.blocks;
  if (subIds?.length) {
    if (visited.has(blockId)) return [];
    visited.add(blockId);
    const urls = subIds.flatMap((id) => collectBlockMediaUrls(id, byId, visited));
    if (block.finishingAudioUrl) urls.push(block.finishingAudioUrl);
    visited.delete(blockId);
    return [...new Set(urls)];
  }

  return collectPhaseMediaUrls([
    {
      audioUrl: block.audioUrl ?? block.startAudioUrl,
      startingAudioUrl: block.startingAudioUrl,
      finishingAudioUrl: block.finishingAudioUrl,
    },
  ]);
}

export function sadhanaPracticeMediaUrls(
  practice: SadhanaPractice,
  blocks: readonly SadhanaBlock[] = [],
  blockChoices: Record<number, string> = {},
): string[] {
  return collectPhaseMediaUrls(resolveSadhanaPhases(practice, blocks, blockChoices));
}

/** Все URL для офлайн-кеша: объединение медиа всех альтернативных блоков. */
export function sadhanaPracticeAllMediaUrls(
  practice: SadhanaPractice,
  blocks: readonly SadhanaBlock[] = [],
): string[] {
  const byId = blocksById(blocks);
  const urls: string[] = [];

  for (const phase of practice.phases) {
    const altIds = getPhaseAlternativeIds(phase);
    const blockIds = altIds ?? [resolveBlockRef(phase)];
    for (const blockId of blockIds) {
      urls.push(...collectBlockMediaUrls(blockId, byId));
    }
  }

  return [...new Set(urls)];
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
