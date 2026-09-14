import { describe, expect, it } from 'vitest';
import { pickNewerSnapshot, type PracticeStatsSnapshot } from '@/vk/statsSync';

function snap(partial: Partial<PracticeStatsSnapshot>): PracticeStatsSnapshot {
  return {
    v: 1,
    totalSessions: 1,
    streakDays: 1,
    lastPracticeDate: '2026-01-01',
    monthKey: '2026-01',
    secondsThisMonth: 60,
    lastSession: {
      mode: 'timer',
      durationSeconds: 60,
      completedAt: 1000,
    },
    ...partial,
  };
}

describe('VK stats merge on device conflict', () => {
  it('picks remote when completedAt is newer', () => {
    const local = snap({ totalSessions: 2, lastSession: { mode: 'timer', durationSeconds: 60, completedAt: 1000 } });
    const remote = snap({ totalSessions: 9, lastSession: { mode: 'timer', durationSeconds: 120, completedAt: 2000 } });
    expect(pickNewerSnapshot(local, remote).totalSessions).toBe(9);
  });

  it('picks local when local completedAt is newer', () => {
    const local = snap({ totalSessions: 4, lastSession: { mode: 'guided', durationSeconds: 60, completedAt: 3000 } });
    const remote = snap({ totalSessions: 99, lastSession: { mode: 'timer', durationSeconds: 60, completedAt: 1000 } });
    expect(pickNewerSnapshot(local, remote).totalSessions).toBe(4);
  });

  it('ties on completedAt by totalSessions', () => {
    const local = snap({ totalSessions: 3 });
    const remote = snap({ totalSessions: 7 });
    expect(pickNewerSnapshot(local, remote).totalSessions).toBe(7);
  });
});
