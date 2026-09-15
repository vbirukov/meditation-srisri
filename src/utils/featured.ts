import featured from '@/data/featured.json';
import meditationsData from '@/data/meditations.json';
import sadhanaData from '@/data/sadhana.json';
import type { Meditation, SadhanaCatalog, SadhanaPractice } from '@/types';

const meditations = meditationsData as Meditation[];
const sadhanas = ((sadhanaData as unknown as SadhanaCatalog).practices ?? []) as SadhanaPractice[];

export function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function weekIndex(d = new Date()): number {
  const key = isoWeekKey(d);
  const m = key.match(/-W(\d+)$/);
  return Number(m?.[1] ?? 1);
}

export function getPracticeOfTheWeek(d = new Date()): {
  weekKey: string;
  meditation: Meditation | null;
  sadhana: SadhanaPractice | null;
} {
  const weekKey = isoWeekKey(d);
  const idx = weekIndex(d) - 1;
  const medIds = featured.rotationMeditationIds ?? [];
  const sadIds = featured.rotationSadhanaIds ?? [];
  const medId = medIds.length ? medIds[idx % medIds.length] : undefined;
  const sadId = sadIds.length ? sadIds[idx % sadIds.length] : undefined;
  return {
    weekKey,
    meditation: medId ? meditations.find((m) => m.id === medId) ?? null : null,
    sadhana: sadId ? sadhanas.find((s) => s.id === sadId) ?? null : null,
  };
}

export function getNewMeditations(): Meditation[] {
  const ids = new Set(featured.newMeditationIds ?? []);
  return meditations.filter((m) => ids.has(m.id));
}
