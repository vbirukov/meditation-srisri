import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

function fillIcon(size) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2;
  const cy = size / 2;
  const r = size * (64 / 192);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - cx;
      const dy = y - cy;
      const inCircle = dx * dx + dy * dy <= r * r;
      png.data[idx] = inCircle ? 106 : 245;
      png.data[idx + 1] = inCircle ? 159 : 240;
      png.data[idx + 2] = inCircle ? 168 : 232;
      png.data[idx + 3] = 255;
    }
  }

  return PNG.sync.write(png);
}

function writeIcon(size) {
  const buf = fillIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buf);
}

writeIcon(192);
writeIcon(512);
console.info('[pwa-icons] wrote icon-192.png and icon-512.png');
