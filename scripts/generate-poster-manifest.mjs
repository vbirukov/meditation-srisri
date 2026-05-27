import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const postersDir = path.join(root, 'public', 'media', 'posters');
const outFile = path.join(root, 'src', 'data', 'poster-manifest.json');

const RASTER = /\.(jpe?g|webp|png)$/i;
const SCENES = ['welcome', 'picker', 'session'];

const FALLBACK_SVG = {
  welcome: '/media/posters/welcome.svg',
  picker: '/media/posters/picker.svg',
  session: '/media/posters/session.svg',
};

function matchesScene(filename, prefix) {
  if (!RASTER.test(filename)) return false;
  return (
    new RegExp(`^${prefix}\\.(jpe?g|webp|png)$`, 'i').test(filename) ||
    new RegExp(`^${prefix}\\d+\\.(jpe?g|webp|png)$`, 'i').test(filename)
  );
}

function sortKey(filename, prefix) {
  const m = filename.match(new RegExp(`^${prefix}(\\d+)?\\.`, 'i'));
  if (!m) return 9999;
  return m[1] ? parseInt(m[1], 10) : 0;
}

function collectScene(files, prefix) {
  const matched = files.filter((f) => matchesScene(f, prefix));
  matched.sort((a, b) => sortKey(a, prefix) - sortKey(b, prefix));
  const urls = matched.map((f) => `/media/posters/${f}`);
  if (urls.length === 0) {
    return [FALLBACK_SVG[prefix]];
  }
  return urls;
}

if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

const files = fs.readdirSync(postersDir);
const manifest = Object.fromEntries(
  SCENES.map((scene) => [scene, collectScene(files, scene)]),
);

fs.writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('poster-manifest.json:', manifest);
