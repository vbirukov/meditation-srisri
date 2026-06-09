import type { CustomPractice, CustomPracticeStep, Locale, SadhanaBlock, SadhanaPractice } from '@/types';
import {
  expandBlockPhases,
  formatPhaseDuration,
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

export function listSavedCustomPractices(practices: readonly CustomPractice[]): CustomPractice[] {
  return [...practices]
    .filter((p) => p.isDraft !== true && p.steps.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function customPracticeToSadhanaPractice(
  practice: CustomPractice,
  untitledLabel: string,
): SadhanaPractice {
  return {
    id: practice.id,
    title: practice.title.trim() || untitledLabel,
    description: practice.description,
    phases: practice.steps.map((step) => ({
      id: step.instanceId,
      blockId: step.blockId,
      label: step.label,
      durationSeconds: step.durationSeconds,
    })),
  };
}

export function createEmptyPractice(): CustomPractice {
  const now = Date.now();
  return {
    id: newInstanceId(),
    title: '',
    steps: [],
    updatedAt: now,
    isDraft: true,
  };
}

export function resolveCustomPracticeSteps(
  practice: CustomPractice,
  blocks: readonly SadhanaBlock[],
): ResolvedSadhanaPhase[] {
  const byId = Object.fromEntries(blocks.map((b) => [b.id, b]));

  const phases: ResolvedSadhanaPhase[] = [];

  for (const step of practice.steps) {
    const overrides = {
      id: step.instanceId,
      blockId: step.blockId,
      label: step.label,
      durationSeconds: step.durationSeconds,
    };
    const expanded = expandBlockPhases(step.blockId, byId, overrides);

    for (let i = 0; i < expanded.length; i++) {
      const resolved = expanded[i]!;
      const isFirst = i === 0;

      let audioUrl = resolved.audioUrl;
      let startingAudioUrl = resolved.startingAudioUrl;
      let finishingAudioUrl = resolved.finishingAudioUrl;

      if (step.playMainAudio === false) audioUrl = undefined;
      if (step.playStartingAudio === false) startingAudioUrl = undefined;
      if (step.playFinishingAudio === false) finishingAudioUrl = undefined;

      phases.push({
        id: isFirst ? step.instanceId : `${step.instanceId}--${resolved.sourceBlockId ?? i}`,
        label: isFirst && step.label ? step.label : resolved.label,
        durationSeconds: isFirst
          ? (step.durationSeconds ?? resolved.durationSeconds)
          : resolved.durationSeconds,
        audioUrl,
        startingAudioUrl,
        finishingAudioUrl,
        sourceBlockId: resolved.sourceBlockId ?? step.blockId,
      });
    }
  }

  return phases;
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

export function formatPhaseCountLabel(count: number, locale: Locale): string {
  if (locale === 'en') {
    return count === 1 ? '1 phase' : `${count} phases`;
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${count} этапов`;
  if (mod10 === 1) return `${count} этап`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} этапа`;
  return `${count} этапов`;
}

export function formatCustomPracticeSavedSummary(
  practice: CustomPractice,
  blocks: readonly SadhanaBlock[],
  locale: Locale,
  messages: { empty: string; summary: string; summaryApprox: string },
): string {
  const count = practice.steps.length;
  if (count === 0) return messages.empty;

  const { totalSeconds, hasUnknown } = customPracticeTotalSeconds(practice, blocks);
  const duration = hasUnknown
    ? `≈ ${formatPhaseDuration(totalSeconds)}`
    : formatPhaseDuration(totalSeconds);
  const phases = formatPhaseCountLabel(count, locale);
  const template = hasUnknown ? messages.summaryApprox : messages.summary;

  return template.replace('{phases}', phases).replace('{duration}', duration);
}

export function blockDurationLabel(block: SadhanaBlock): string | null {
  if (typeof block.durationSeconds === 'number') {
    return formatPhaseDuration(block.durationSeconds);
  }
  if (block.audioUrl) return '♪';
  return null;
}
