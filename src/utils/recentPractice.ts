export function splitRecent<T extends { id: string }>(
  items: T[],
  recentId: string | null | undefined,
): { recent: T | null; rest: T[] } {
  if (!recentId) return { recent: null, rest: items };
  const recent = items.find((item) => item.id === recentId) ?? null;
  if (!recent) return { recent: null, rest: items };
  return { recent, rest: items.filter((item) => item.id !== recentId) };
}
