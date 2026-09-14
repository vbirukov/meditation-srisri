import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const source = path.join(iconsDir, 'icon.png');

async function writeIcon(size) {
  await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(path.join(iconsDir, `icon-${size}.png`));
}

await writeIcon(192);
await writeIcon(512);
console.info('[pwa-icons] wrote icon-192.png and icon-512.png from icon.png');
