import { describe, expect, it } from 'vitest';
import { buildShareMessage, buildStoryText, pickStoryBackground } from '@/vk/share';

describe('share story copy', () => {
  it('includes streak and month in story text', () => {
    const text = buildStoryText({
      locale: 'ru',
      practiceTitle: 'Ом',
      durationLabel: '10 мин',
      streakDays: 7,
      monthLabel: '40 мин',
    });
    expect(text).toContain('Ом');
    expect(text).toContain('Серия: 7');
    expect(text).toContain('40 мин');
  });

  it('puts deep link into wall message', () => {
    const msg = buildShareMessage({
      locale: 'ru',
      practiceTitle: 'Улыбка',
      durationLabel: '15 мин',
      streakDays: 2,
      deepLink: { meditationId: 'smile', ref: 'wall' },
    });
    expect(msg).toContain('#/session?');
    expect(msg).toContain('m=smile');
    expect(msg).toContain('ref=wall');
  });

  it('picks story background by streak/mode', () => {
    expect(pickStoryBackground({ streakDays: 1 })).toContain('welcome1');
    expect(pickStoryBackground({ streakDays: 8 })).toContain('welcome3');
    expect(pickStoryBackground({ streakDays: 2, mode: 'sadhana' })).toContain('session');
  });
});
