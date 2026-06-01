import type { CustomPractice, CustomPracticeStep, SadhanaBlock } from '@/types';
import {
  formatPhaseDuration,
  resolveSadhanaPhases,
  type ResolvedSadhanaPhase,
} from '@/utils/sadhana';

export function newInstanceId(): string {
  return crypto.randomUUID();
}

export function createStepFromBlock(block: SadhanaBlock): CustomPracticeStep {
  return {
    instanceId: newInstanceId(),
    blockId: block.id,
    playMainAudio: Boolean(block.audioUrl || block.startAudioUrl),
    playStartingAudio: Boolean(block.startingAudioUrl),
    playFinishingAudio: Boolean(block.finishingAudioUrl),
  };
}

export function createEmptyPractice(): CustomPractice {
  const now = Date.now();
  return {
    id: newInstanceId(),
    title: '',
    steps: [],
    updatedAt: now,
  };
}

export function resolveCustomPracticeSteps(
  practice: CustomPractice,
  blocks: readonly SadhanaBlock[],
): ResolvedSadhanaPhase[] {
  const byId = Object.fromEntries(blocks.map((b) => [b.id, b]));

  return practice.steps.map((step) => {
    const block = byId[step.blockId];
    const asPractice = {
      id: practice.id,
      title: practice.title,
      phases: [
        {
          id: step.instanceId,
          blockId: step.blockId,
          label: step.label,
          durationSeconds: step.durationSeconds,
        },
      ],
    };
    const [resolved] = resolveSadhanaPhases(asPractice, block ? [block] : blocks);

    let audioUrl = resolved.audioUrl;
    let startingAudioUrl = resolved.startingAudioUrl;
    let finishingAudioUrl = resolved.finishingAudioUrl;

    if (step.playMainAudio === false) audioUrl = undefined;
    if (step.playStartingAudio === false) startingAudioUrl = undefined;
    if (step.playFinishingAudio === false) finishingAudioUrl = undefined;

    return {
      id: step.instanceId,
      label: step.label || resolved.label,
      durationSeconds: step.durationSeconds ?? resolved.durationSeconds,
      audioUrl,
      startingAudioUrl,
      finishingAudioUrl,
      sourceBlockId: step.blockId,
    };
  });
}

export function customPracticeTotalSeconds(
  practice: CustomPractice,
  blocks: readonly SadhanaBlock[],
): { totalSeconds: number; hasUnknown: boolean } {
  const phases = resolveCustomPracticeSteps(practice, blocks);
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

export function formatCustomPracticeTotal(
  practice: CustomPractice,
  blocks: readonly SadhanaBlock[],
): string {
  const { totalSeconds, hasUnknown } = customPracticeTotalSeconds(practice, blocks);
  if (practice.steps.length === 0) return '—';
  return hasUnknown
    ? `≈ ${formatPhaseDuration(totalSeconds)}`
    : formatPhaseDuration(totalSeconds);
}

export function blockDurationLabel(block: SadhanaBlock): string | null {
  if (typeof block.durationSeconds === 'number') {
    return formatPhaseDuration(block.durationSeconds);
  }
  if (block.audioUrl) return '♪';
  return null;
}
