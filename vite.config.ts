import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function loadOfflineManifest(): { precacheUrls: string[]; videoUrls: string[] } {
  const manifestPath = path.resolve(__dirname, 'src/data/offline-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { precacheUrls: [], videoUrls: [] };
  }
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    precacheUrls?: string[];
    videoUrls?: string[];
  };
  return {
    precacheUrls: raw.precacheUrls ?? [],
    videoUrls: raw.videoUrls ?? [],
  };
}

const offlineManifest = loadOfflineManifest();
const precacheAudioPattern = new RegExp(
  `^/media/audio/(?:${offlineManifest.precacheUrls
    .map((u) => u.replace(/^\/media\/audio\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})$`,
  'i',
);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        id: '/',
        name: 'Meditate with Sri Sri',
        short_name: 'Sri Sri Meditate',
        description: 'Спокойные медитации — guided и таймер',
        start_url: '/welcome',
        scope: '/',
        display: 'standalone',
        background_color: '#F9F6EE',
        theme_color: '#F9F6EE',
        orientation: 'portrait-primary',
        lang: 'ru',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,json,woff2}'],
        additionalManifestEntries: offlineManifest.precacheUrls.map((url) => ({
          url,
          revision: null,
        })),
        runtimeCaching: [
          {
            urlPattern: /^\/media\/.+\.(?:png|jpe?g|webp|gif|svg)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'media-images-cache',
              expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          ...(offlineManifest.precacheUrls.length > 0
            ? [
                {
                  urlPattern: precacheAudioPattern,
                  handler: 'CacheFirst' as const,
                  options: {
                    cacheName: 'meditate-precache-audio',
                    expiration: {
                      maxEntries: 64,
                      maxAgeSeconds: 60 * 60 * 24 * 365,
                    },
                  },
                },
              ]
            : []),
          {
            urlPattern: /^\/media\/.+\.(?:mp3|m4a|ogg|wav)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'media-audio-cache',
              expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^\/media\/video\/.+\.(?:mp4|webm)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'media-video-cache',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
