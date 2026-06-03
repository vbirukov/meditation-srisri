import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function pickMainAudio(...sources) {
  for (const s of sources) {
    if (!s) continue;
    if (s.audioUrl) return s.audioUrl;
    if (s.startAudioUrl) return s.startAudioUrl;
  }
  return undefined;
}

function pickStarting(...sources) {
  for (const s of sources) {
    if (s?.startingAudioUrl) return s.startingAudioUrl;
  }
  return undefined;
}

function pickFinishing(...sources) {
  for (const s of sources) {
    if (s?.finishingAudioUrl) return s.finishingAudioUrl;
  }
  return undefined;
}

function resolveBlock(phase, byId) {
  const ref = phase.blockId ?? phase.preset;
  if (ref) return byId[ref];
  return byId[phase.id];
}

function resolvePhases(practice, blocks) {
  const byId = Object.fromEntries(blocks.map((b) => [b.id, b]));
  return practice.phases.map((p) => {
    const block = resolveBlock(p, byId);
    if (!block) {
      return {
        audioUrl: pickMainAudio(p),
        startingAudioUrl: pickStarting(p),
        finishingAudioUrl: pickFinishing(p),
      };
    }
    return {
      audioUrl: pickMainAudio(p, block),
      startingAudioUrl: pickStarting(p, block),
      finishingAudioUrl: pickFinishing(p, block),
    };
  });
}

function phaseMediaUrls(phase) {
  const urls = [];
  if (phase.audioUrl) urls.push(phase.audioUrl);
  if (phase.startingAudioUrl) urls.push(phase.startingAudioUrl);
  if (phase.finishingAudioUrl) urls.push(phase.finishingAudioUrl);
  return urls;
}

function blockMediaUrls(block) {
  const urls = [];
  if (block.audioUrl) urls.push(block.audioUrl);
  if (block.startAudioUrl) urls.push(block.startAudioUrl);
  if (block.startingAudioUrl) urls.push(block.startingAudioUrl);
  if (block.finishingAudioUrl) urls.push(block.finishingAudioUrl);
  return urls;
}

function unique(urls) {
  return [...new Set(urls.filter(Boolean))];
}

const meditations = readJson('src/data/meditations.json');
const sadhana = readJson('src/data/sadhana.json');
const blocks = sadhana.blocks ?? [];
const practices = sadhana.practices ?? [];

const precacheFromMeditations = meditations
  .filter((m) => m.isOfflinePrecached && m.mediaUrl)
  .map((m) => m.mediaUrl);

const precacheFromBlocks = unique(blocks.flatMap(blockMediaUrls));

const precacheUrls = unique([...precacheFromMeditations, ...precacheFromBlocks]);

const practiceMedia = practices.map((practice) => {
  const phases = resolvePhases(practice, blocks);
  const urls = unique(phases.flatMap(phaseMediaUrls));
  return {
    id: practice.id,
    urls,
    offlineReady: urls.length === 0 || urls.every((u) => precacheUrls.includes(u)),
  };
});

const videoUrls = unique([
  '/media/video/welcome.mp4',
  '/media/video/picker.mp4',
  '/media/video/picker2.mp4',
  '/media/video/session.mp4',
  '/media/video/session2.mp4',
]);

const manifest = {
  generatedAt: new Date().toISOString(),
  precacheUrls,
  videoUrls,
  practices: practiceMedia,
  offlineReadyPracticeIds: practiceMedia.filter((p) => p.offlineReady).map((p) => p.id),
};

const outPath = path.join(root, 'src', 'data', 'offline-manifest.json');
fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log('offline-manifest.json:', {
  precache: precacheUrls.length,
  videos: videoUrls.length,
  sadhanaReady: manifest.offlineReadyPracticeIds,
});
