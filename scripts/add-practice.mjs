/**
 * Add a guided practice from a source media file.
 * Pipeline: original → encode → public/media → meditations.json → manifests.
 *
 * Audio:
 *   node scripts/add-practice.mjs --type audio --file ./in.mp3 --id my-id --title "Title" --lang ru
 * Video:
 *   node scripts/add-practice.mjs --type video --file ./in.mp4 --id my-id --title "Title" --lang ru
 *
 * Options:
 *   --desc "..."          description
 *   --scene ganga|sea     audio background (default ganga)
 *   --offline             mark isOfflinePrecached (audio only by default)
 *   --dry                 print plan, no writes
 *   --force               overwrite existing media / replace JSON entry
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return process.argv[i + 1] ?? fallback;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const dry = flag('dry');
const force = flag('force');
const type = arg('type');
const file = arg('file');
const id = arg('id');
const title = arg('title');
const desc = arg('desc', '');
const lang = arg('lang', 'ru');
const scene = arg('scene', 'ganga');
const offline = flag('offline');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function ffmpegOk() {
  return spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status === 0;
}

function ffprobeDuration(abs) {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', abs],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(r.stderr || 'ffprobe failed');
  const n = Number(r.stdout.trim());
  if (!Number.isFinite(n) || n <= 0) throw new Error(`bad duration: ${r.stdout}`);
  return Math.round(n);
}

function encodeAudio(src, dest) {
  const r = spawnSync(
    'ffmpeg',
    ['-y', '-i', src, '-vn', '-ac', '1', '-ar', '44100', '-b:a', '96k', '-codec:a', 'libmp3lame', dest],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(r.stderr?.slice(-400) || 'ffmpeg audio failed');
}

function encodeVideo(src, dest, height) {
  const r = spawnSync(
    'ffmpeg',
    [
      '-y', '-i', src,
      '-vf', `scale=-2:${height}`,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
      '-c:a', 'aac', '-b:a', '96k',
      '-movflags', '+faststart',
      dest,
    ],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(r.stderr?.slice(-400) || `ffmpeg ${height}p failed`);
}

function slugId(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(s)) {
    die(`bad --id "${raw}": use ascii slug like spine-breath`);
  }
  return s;
}

function runManifests() {
  for (const script of ['generate-media-manifest.mjs', 'generate-offline-manifest.mjs']) {
    const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
      encoding: 'utf8',
      cwd: root,
    });
    if (r.status !== 0) throw new Error(r.stderr || r.stdout || `${script} failed`);
    process.stdout.write(r.stdout || '');
  }
}

/** Exported for self-check / tests */
export function buildMeditationEntry(opts) {
  const entry = {
    id: opts.id,
    type: opts.type,
    title: opts.title,
    durationSeconds: opts.durationSeconds,
    mediaUrl: opts.mediaUrl,
    language: opts.lang,
  };
  if (opts.desc) entry.description = opts.desc;
  if (opts.type === 'audio') {
    entry.backgroundScene = opts.scene || 'ganga';
    if (opts.offline) entry.isOfflinePrecached = true;
  }
  return entry;
}

function main() {
  if (!type || !file || !id || !title) {
    die('Usage: --type audio|video --file PATH --id slug --title "…" [--lang ru] [--offline] [--dry]');
  }
  if (type !== 'audio' && type !== 'video') die('--type must be audio|video');
  if (!['en', 'ru', 'hi', 'multi'].includes(lang)) die('--lang must be en|ru|hi|multi');

  const practiceId = slugId(id);
  const absIn = path.resolve(file);
  if (!fs.existsSync(absIn)) die(`file not found: ${absIn}`);
  if (!ffmpegOk()) die('ffmpeg/ffprobe not on PATH');

  const catalogPath = path.join(root, 'src', 'data', 'meditations.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const existingIdx = catalog.findIndex((m) => m.id === practiceId);
  if (existingIdx >= 0 && !force) die(`id already exists: ${practiceId} (use --force)`);

  const originalsDir =
    type === 'audio'
      ? path.join(root, 'media-originals', 'audio')
      : path.join(root, 'media-originals', 'video', 'meditations');
  const publicDir =
    type === 'audio'
      ? path.join(root, 'public', 'media', 'audio')
      : path.join(root, 'public', 'media', 'video', 'meditations');

  const ext = type === 'audio' ? '.mp3' : '.mp4';
  const baseName = `${practiceId}${ext}`;
  const originalDest = path.join(originalsDir, path.basename(absIn).replace(/\s+/g, '_'));
  const publicDest = path.join(publicDir, baseName);
  const mediaUrl =
    type === 'audio'
      ? `/media/audio/${baseName}`
      : `/media/video/meditations/${baseName}`;

  console.log({
    id: practiceId,
    type,
    title,
    lang,
    mediaUrl,
    originalDest: path.relative(root, originalDest),
    publicDest: path.relative(root, publicDest),
    offline: type === 'audio' && offline,
    dry,
  });

  if (dry) {
    console.log('dry-run ok');
    return;
  }

  fs.mkdirSync(originalsDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(absIn, originalDest);

  if (type === 'audio') {
    encodeAudio(absIn, publicDest);
  } else {
    const r480 = publicDest.replace(/\.mp4$/i, '.480p.mp4');
    const r720 = publicDest.replace(/\.mp4$/i, '.720p.mp4');
    if (force || !fs.existsSync(r480)) encodeVideo(absIn, r480, 480);
    if (force || !fs.existsSync(r720)) encodeVideo(absIn, r720, 720);
    // base mediaUrl target = 720p copy (player requests .Np.mp4 via videoRenditionUrl)
    fs.copyFileSync(r720, publicDest);
  }

  const durationSeconds = ffprobeDuration(publicDest);
  const entry = buildMeditationEntry({
    id: practiceId,
    type,
    title,
    desc,
    lang,
    scene,
    offline: type === 'audio' && offline,
    durationSeconds,
    mediaUrl,
  });

  if (existingIdx >= 0) catalog[existingIdx] = entry;
  else catalog.push(entry);

  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  runManifests();
  console.log('added', entry);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (flag('self-check')) {
    const a = buildMeditationEntry({
      id: 'x',
      type: 'audio',
      title: 'X',
      lang: 'ru',
      offline: true,
      durationSeconds: 10,
      mediaUrl: '/media/audio/x.mp3',
    });
    if (!a.isOfflinePrecached || a.backgroundScene !== 'ganga') throw new Error('audio entry broken');
    const v = buildMeditationEntry({
      id: 'y',
      type: 'video',
      title: 'Y',
      lang: 'en',
      durationSeconds: 10,
      mediaUrl: '/media/video/meditations/y.mp4',
    });
    if (v.isOfflinePrecached) throw new Error('video should not be offline by default');
    console.log('add-practice self-check ok');
    process.exit(0);
  }
  main();
}
