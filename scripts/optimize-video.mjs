/**
 * Create 480p/720p H.264 renditions next to each mp4 under public/media/video.
 * Originals stay in place (or --move-originals → media-originals/video/).
 * Requires ffmpeg on PATH.
 *
 * Usage: node scripts/optimize-video.mjs
 *        node scripts/optimize-video.mjs --move-originals
 *        node scripts/optimize-video.mjs --dry
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const videoRoot = path.join(root, 'public', 'media', 'video');
const originalsRoot = path.join(root, 'media-originals', 'video');
const dry = process.argv.includes('--dry');
const moveOriginals = process.argv.includes('--move-originals');

const HEIGHTS = [480, 720];
const CRF = '23';
const AUDIO_BR = '96k';

function ffmpegOk() {
  return spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).status === 0;
}

function listMp4(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const st = fs.statSync(abs);
    if (st.isDirectory()) listMp4(abs, acc);
    else if (/\.mp4$/i.test(name) && !/\.\d{3,4}p\.mp4$/i.test(name)) acc.push(abs);
  }
  return acc;
}

function encode(src, dest, height) {
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      src,
      '-vf',
      `scale=-2:${height}`,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      CRF,
      '-c:a',
      'aac',
      '-b:a',
      AUDIO_BR,
      '-movflags',
      '+faststart',
      dest,
    ],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(r.stderr?.slice(-500) || `ffmpeg failed ${src}`);
}

function main() {
  if (!ffmpegOk()) {
    console.error('ffmpeg not on PATH. Install: winget install Gyan.FFmpeg');
    process.exit(1);
  }

  const files = listMp4(videoRoot);
  console.log(`found ${files.length} source mp4`);

  for (const abs of files) {
    const rel = path.relative(videoRoot, abs);
    const size = fs.statSync(abs).size;
    console.log(`\n${rel} (${(size / 1e6).toFixed(1)}MB)`);

    for (const h of HEIGHTS) {
      const out = abs.replace(/\.mp4$/i, `.${h}p.mp4`);
      if (fs.existsSync(out) && fs.statSync(out).size > 0) {
        console.log(`  skip ${h}p (exists)`);
        continue;
      }
      if (dry) {
        console.log(`  would encode ${h}p`);
        continue;
      }
      console.log(`  encoding ${h}p…`);
      encode(abs, out, h);
      console.log(`  → ${(fs.statSync(out).size / 1e6).toFixed(1)}MB`);
    }

    if (moveOriginals && !dry) {
      const dest = path.join(originalsRoot, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.renameSync(abs, dest);
      console.log(`  moved original → media-originals/video/${rel}`);
    }
  }
}

main();
