/**
 * ponytail: one check — mood binds to lastSession + moodLog upsert by completedAt.
 * Run: node scripts/check-mood.mjs
 */
import assert from 'node:assert/strict';

const MOOD_LOG_MAX = 60;

function setLastSessionMood(state, mood) {
  const trimmed = mood.trim();
  if (!trimmed) return state;
  const last = state.lastSession;
  if (!last) return state;
  const moodLog = [
    ...(state.moodLog ?? []).filter((e) => e.completedAt !== last.completedAt),
    { completedAt: last.completedAt, mood: trimmed },
  ].slice(-MOOD_LOG_MAX);
  return {
    ...state,
    lastSession: { ...last, mood: trimmed },
    moodLog,
  };
}

let state = {
  lastSession: { mode: 'timer', durationSeconds: 60, completedAt: 1000, mood: null },
  moodLog: [],
};

state = setLastSessionMood(state, 'calm');
assert.equal(state.lastSession.mood, 'calm');
assert.equal(state.moodLog.length, 1);

state = setLastSessionMood(state, 'peaceful');
assert.equal(state.lastSession.mood, 'peaceful');
assert.equal(state.moodLog.length, 1, 'same session upserts one log row');
assert.equal(state.moodLog[0].mood, 'peaceful');

state = {
  ...state,
  lastSession: { mode: 'guided', durationSeconds: 300, completedAt: 2000, mood: null },
};
state = setLastSessionMood(state, 'tired');
assert.equal(state.moodLog.length, 2);

console.log('[mood] self-check ok');
