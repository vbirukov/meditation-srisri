/**
 * PNG/JPEG textures → WebP. Originals move to media-originals/textures/.
 * Usage: node scripts/optimize-textures.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'public', 'media', 'textures');
const originalsDir = path.join(root, 'media-originals', 'textures');

const QUALITY = 80;
const RASTER = /\.(png|jpe?g)$/i;

async function convertOne(file) {
  const abs = path.join(srcDir, file);
  const base = file.replace(RASTER, '');
  const outName = `${base}.webp`;
  const outAbs = path.join(srcDir, outName);
  const originalAbs = path.join(originalsDir, file);

  await sharp(abs).webp({ quality: QUALITY }).toFile(outAbs);

  fs.mkdirSync(originalsDir, { recursive: true });
  if (fs.existsSync(originalAbs)) fs.unlinkSync(originalAbs);
  fs.renameSync(abs, originalAbs);

  const before = fs.statSync(originalAbs).size;
  const after = fs.statSync(outAbs).size;
  return { file, outName, before, after };
}

async function main() {
  if (!fs.existsSync(srcDir)) {
    console.error('missing', srcDir);
    process.exit(1);
  }
  const files = fs.readdirSync(srcDir).filter((f) => RASTER.test(f));
  if (files.length === 0) {
    console.log('no png/jpeg textures to convert');
    return;
  }

  let beforeTotal = 0;
  let afterTotal = 0;
  for (const file of files) {
    const r = await convertOne(file);
    beforeTotal += r.before;
    afterTotal += r.after;
    console.log(
      `${r.file} → ${r.outName}: ${(r.before / 1e6).toFixed(2)}MB → ${(r.after / 1e6).toFixed(2)}MB`,
    );
  }
  console.log(
    `done: ${files.length} files, ${(beforeTotal / 1e6).toFixed(1)}MB → ${(afterTotal / 1e6).toFixed(1)}MB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
