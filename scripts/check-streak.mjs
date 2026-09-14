import assert from 'node:assert/strict';

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayKey(todayKey) {
  const [y, m, d] = todayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

function getStreakView(lastPracticeDate, streakDays, now = new Date()) {
  const today = toDateKey(now);
  const practicedToday = lastPracticeDate === today;
  if (!lastPracticeDate || streakDays <= 0) {
    return { days: 0, practicedToday: false, atRisk: false };
  }
  if (practicedToday) return { days: streakDays, practicedToday: true, atRisk: false };
  if (lastPracticeDate === yesterdayKey(today)) {
    return { days: streakDays, practicedToday: false, atRisk: true };
  }
  return { days: 0, practicedToday: false, atRisk: false };
}

const now = new Date(2026, 2, 15);
const today = toDateKey(now);
const y = yesterdayKey(today);

const risk = getStreakView(y, 5, now);
assert.equal(risk.atRisk, true);
assert.equal(risk.days, 5);

const dead = getStreakView('2026-03-10', 5, now);
assert.equal(dead.days, 0);

const safe = getStreakView(today, 5, now);
assert.equal(safe.practicedToday, true);
assert.equal(safe.atRisk, false);

console.log('[streak] self-check ok');
