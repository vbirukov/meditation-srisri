export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function yesterdayKey(todayKey: string): string {
  const [y, m, d] = todayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

export function nextStreakDays(
  lastPracticeDate: string | null,
  todayKey: string,
  currentStreak: number,
): number {
  if (lastPracticeDate === todayKey) return currentStreak;
  if (lastPracticeDate === yesterdayKey(todayKey)) return currentStreak + 1;
  return 1;
}

export function formatPracticeDuration(seconds: number, locale: 'ru' | 'en'): string {
  const totalMin = Math.max(1, Math.round(seconds / 60));
  if (totalMin < 60) {
    return locale === 'ru' ? `${totalMin} мин` : `${totalMin} min`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (m === 0) {
    return locale === 'ru' ? `${h} ч` : `${h} h`;
  }
  return locale === 'ru' ? `${h} ч ${m} мин` : `${h} h ${m} min`;
}

export function formatMonthTotal(seconds: number, locale: 'ru' | 'en'): string {
  if (seconds < 3600) {
    const min = Math.round(seconds / 60);
    return locale === 'ru' ? `${min} мин` : `${min} min`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (m === 0) {
    return locale === 'ru' ? `${h} ч` : `${h} h`;
  }
  return locale === 'ru' ? `${h} ч ${m} мин` : `${h} h ${m} min`;
}
