/**
 * One runnable check for catalog integrity (duplicate ids).
 * Run: npm run check:catalog
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sadhana = JSON.parse(fs.readFileSync(path.join(root, 'src/data/sadhana.json'), 'utf8'));
const meditations = JSON.parse(fs.readFileSync(path.join(root, 'src/data/meditations.json'), 'utf8'));

function dupes(ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    if (seen.has(id)) out.push(id);
    else seen.add(id);
  }
  return out;
}

const bad = [
  ...dupes((sadhana.practices ?? []).map((p) => p.id)).map((id) => `practice:${id}`),
  ...dupes((sadhana.blocks ?? []).map((b) => b.id)).map((id) => `block:${id}`),
  ...dupes(meditations.map((m) => m.id)).map((id) => `meditation:${id}`),
];

if (bad.length) {
  console.error('FAIL duplicate ids:', bad.join(', '));
  process.exit(1);
}
console.log('OK catalog ids unique', {
  practices: (sadhana.practices ?? []).length,
  blocks: (sadhana.blocks ?? []).length,
  meditations: meditations.length,
});
