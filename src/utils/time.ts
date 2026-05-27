export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function wallClockProgress(
  startedAt: number | null,
  pausedAt: number | null,
  pausedProgress: number,
): number {
  if (!startedAt) return pausedProgress;
  if (pausedAt) return pausedProgress;
  return (Date.now() - startedAt) / 1000;
}
