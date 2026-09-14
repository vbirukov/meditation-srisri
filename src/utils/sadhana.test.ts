import { describe, expect, it } from 'vitest';
import type { SadhanaBlock, SadhanaPhase, SadhanaPractice } from '@/types';
import { resolveSadhanaPractice, sadhanaTotalSeconds } from '@/utils/sadhana';

const blocks: SadhanaBlock[] = [
  { id: 'a', title: 'A', durationSeconds: 60, audioUrl: '/a.mp3' },
  { id: 'b', title: 'B', durationSeconds: 120, audioUrl: '/b.mp3' },
  { id: 'c', title: 'C', durationSeconds: 30, audioUrl: '/c.mp3' },
];

const practice: SadhanaPractice = {
  id: 'test',
  title: 'Test',
  phases: [
    { id: 'a' },
    // как в sadhana.json: alternatives без id
    { alternatives: ['b', 'c'] } as SadhanaPhase,
    { id: 'c', durationSeconds: 45 },
  ],
};

describe('sadhana phase resolve with alternatives', () => {
  it('defaults alternative slot to first option', () => {
    const { phases, slots } = resolveSadhanaPractice(practice, blocks);
    expect(slots[1]?.selectedBlockId).toBe('b');
    expect(phases.map((p) => p.sourceBlockId ?? p.id)).toContain('b');
    expect(slots[1]?.alternatives?.map((a) => a.blockId)).toEqual(['b', 'c']);
  });

  it('honors blockChoices for alternative slot', () => {
    const { slots, phases } = resolveSadhanaPractice(practice, blocks, { 1: 'c' });
    expect(slots[1]?.selectedBlockId).toBe('c');
    expect(phases.some((p) => p.sourceBlockId === 'c' || p.id === 'c')).toBe(true);
  });

  it('sums durations with overrides', () => {
    const { totalSeconds, hasUnknown } = sadhanaTotalSeconds(practice, blocks, { 1: 'c' });
    // a=60 + c=30 (from block, override duration on phase id c is 45 for slot 2)
    // slot0 a=60, slot1 c=30, slot2 c with durationSeconds 45
    expect(hasUnknown).toBe(false);
    expect(totalSeconds).toBe(60 + 30 + 45);
  });
});
