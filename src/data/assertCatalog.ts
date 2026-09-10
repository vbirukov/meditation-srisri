import meditationsData from '@/data/meditations.json';
import sadhanaData from '@/data/sadhana.json';

/** Fail-fast check: duplicate practice/block ids break find() silently. */
export function assertCatalogIntegrity(): void {
  const practices = (sadhanaData as { practices?: { id: string }[] }).practices ?? [];
  const blocks = (sadhanaData as { blocks?: { id: string }[] }).blocks ?? [];
  const meditations = meditationsData as { id: string }[];

  const dupes = (ids: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) out.push(id);
      else seen.add(id);
    }
    return out;
  };

  const bad = [
    ...dupes(practices.map((p) => p.id)).map((id) => `sadhana.practice:${id}`),
    ...dupes(blocks.map((b) => b.id)).map((id) => `sadhana.block:${id}`),
    ...dupes(meditations.map((m) => m.id)).map((id) => `meditation:${id}`),
  ];

  if (bad.length > 0) {
    const msg = `[catalog] duplicate ids: ${bad.join(', ')}`;
    if (import.meta.env.DEV) throw new Error(msg);
    console.error(msg);
  }
}
