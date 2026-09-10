/**
 * Dev placeholders only. Writes into media-originals/, NEVER into public/media.
 * Real product media lives in public/media and is optimized via optimize-*.mjs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'media-originals');

function writeWav(filePath, durationSec = 30, sampleRate = 22050) {
  const numSamples = sampleRate * durationSec;
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

const audioFiles = [
  ['audio/breath-5.wav', 300],
  ['audio/gratitude-10.wav', 600],
  ['audio/bell.wav', 2],
];

for (const [rel, sec] of audioFiles) {
  writeWav(path.join(root, rel), sec);
  console.log('wrote media-originals/', rel);
}

console.log('Note: silence is a timer phase — no silence audio placeholder.');
