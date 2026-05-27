import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const RASTER = /\.(jpe?g|webp|png)$/i;

const POSTER_SCENES = ['welcome', 'picker', 'session'];
const POSTER_FALLBACK = {
  welcome: '/media/posters/welcome.svg',
  picker: '/media/posters/picker.svg',
  session: '/media/posters/session.svg',
};

const TEXTURE_GROUPS = [
  'meditation-card',
  'sadhana-card',
  'section-header',
  'practice-tools',
  'session-chrome',
  'end-screen',
  'end-hero',
  'end-summary',
  'end-stats',
  'end-mood',
];

function matchesPrefix(filename, prefix) {
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

function collectFiles(dir, urlPrefix, prefix, fallback) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return fallback ? [fallback] : [];
  }
  const files = fs.readdirSync(dir);
  const matched = files.filter((f) => matchesPrefix(f, prefix));
  matched.sort((a, b) => sortKey(a, prefix) - sortKey(b, prefix));
  const urls = matched.map((f) => `${urlPrefix}/${f}`);
  if (urls.length === 0 && fallback) return [fallback];
  return urls;
}

const postersDir = path.join(root, 'public', 'media', 'posters');
const texturesDir = path.join(root, 'public', 'media', 'textures');

const posterManifest = Object.fromEntries(
  POSTER_SCENES.map((scene) => [
    scene,
    collectFiles(postersDir, '/media/posters', scene, POSTER_FALLBACK[scene]),
  ]),
);

const textureManifest = Object.fromEntries(
  TEXTURE_GROUPS.map((group) => [
    group,
    collectFiles(texturesDir, '/media/textures', group, null),
  ]),
);

fs.writeFileSync(
  path.join(root, 'src', 'data', 'poster-manifest.json'),
  `${JSON.stringify(posterManifest, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, 'src', 'data', 'texture-manifest.json'),
  `${JSON.stringify(textureManifest, null, 2)}\n`,
);

console.log('poster-manifest.json:', posterManifest);
console.log('texture-manifest.json:', textureManifest);
