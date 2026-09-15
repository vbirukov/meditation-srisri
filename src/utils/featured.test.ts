import { describe, expect, it } from 'vitest';
import { getNewMeditations, getPracticeOfTheWeek, isoWeekKey } from '@/utils/featured';

describe('featured rotation', () => {
  it('iso week key is stable format', () => {
    expect(isoWeekKey(new Date('2026-09-15T12:00:00Z'))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('returns a meditation from rotation', () => {
    const potw = getPracticeOfTheWeek(new Date('2026-09-15T12:00:00Z'));
    expect(potw.meditation?.id).toBeTruthy();
    expect(potw.weekKey).toBeTruthy();
  });

  it('lists new meditations from featured.json', () => {
    const neu = getNewMeditations();
    expect(neu.some((m) => m.id === 'love')).toBe(true);
  });
});
