import { describe, expect, it, vi } from 'vitest';
import { getSessionSummary } from '@/utils/gurujiContent';

describe('getSessionSummary', () => {
  it('resolves known meditation and sadhana ids', () => {
    expect(getSessionSummary('guided', 'smile', 'ru')).toMatch(/Улыбка/);
    expect(getSessionSummary('sadhana', undefined, 'ru', 'morning-short')).toMatch(/Утренняя/);
  });

  it('falls back to mode then default with dev warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const text = getSessionSummary('guided', 'no-such-meditation', 'ru');
    expect(text.length).toBeGreaterThan(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
