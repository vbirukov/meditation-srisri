/**
 * Re-encode public/media/audio/*.mp3 to 96k mono AAC-in-MP3 (libmp3lame).
 * Originals → media-originals/audio/. Requires ffmpeg on PATH.
 *
 * Usage: node scripts/optimize-audio.mjs
 * Dry:   node scripts/optimize-audio.mjs --dry
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'public', 'media', 'audio');
const originalsDir = path.join(root, 'media-originals', 'audio');
const dry = process.argv.includes('--dry');

const SKIP = new Set(['bell.mp3']); // short cue — leave as-is
const DELETE = ['silence-15.mp3', 'silence-15.wav', 'breath-5.wav', 'gratitude-10.wav'];

function ffmpegOk() {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return r.status === 0;
}

function encode(src, dest) {
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      src,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '44100',
      '-b:a',
      '96k',
      '-codec:a',
      'libmp3lame',
      dest,
    ],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || `ffmpeg failed for ${src}`);
  }
}

function main() {
  if (!ffmpegOk()) {
    console.error('ffmpeg not on PATH. Install: winget install Gyan.FFmpeg');
    process.exit(1);
  }

  fs.mkdirSync(originalsDir, { recursive: true });

  for (const name of DELETE) {
    const abs = path.join(srcDir, name);
    if (!fs.existsSync(abs)) continue;
    const dest = path.join(originalsDir, name);
    if (dry) {
      console.log('delete/move', name);
      continue;
    }
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    fs.renameSync(abs, dest);
    console.log('moved aside', name);
  }

  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.toLowerCase().endsWith('.mp3') && !SKIP.has(f));

  let before = 0;
  let after = 0;
  for (const file of files) {
    const abs = path.join(srcDir, file);
    const orig = path.join(originalsDir, file);
    const tmp = path.join(srcDir, `.${file}.tmp.mp3`);
    const sizeBefore = fs.statSync(abs).size;
    before += sizeBefore;

    if (dry) {
      console.log('encode', file, `${(sizeBefore / 1e6).toFixed(1)}MB`);
      continue;
    }

    encode(abs, tmp);
    if (fs.existsSync(orig)) fs.unlinkSync(orig);
    fs.renameSync(abs, orig);
    fs.renameSync(tmp, abs);
    const sizeAfter = fs.statSync(abs).size;
    after += sizeAfter;
    console.log(
      `${file}: ${(sizeBefore / 1e6).toFixed(1)}MB → ${(sizeAfter / 1e6).toFixed(1)}MB`,
    );
  }

  if (!dry) {
    console.log(`done: ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB`);
  }
}

main();
