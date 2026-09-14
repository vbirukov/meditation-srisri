import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import bridge from '@vkontakte/vk-bridge';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/work-sans/300.css';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import { track } from './analytics/track';
import { App } from './App';
import { assertCatalogIntegrity } from './data/assertCatalog';
import './styles/global.css';
import { registerSW } from './pwa/registerSW';
import { captureShareAttribution, readLocationShareRef } from './utils/deepLink';
import { isVkMiniApp } from './utils/vk';

const inVk = isVkMiniApp();
assertCatalogIntegrity();
const shareRef = captureShareAttribution();
track('app_open', shareRef ? { ref: shareRef } : {});
const inboundRef = readLocationShareRef();
if (inboundRef) {
  track('share_open', { ref: inboundRef });
}

function bootError(err: unknown) {
  const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);
  const pre = document.createElement('pre');
  pre.style.cssText =
    'position:fixed;inset:12px;z-index:99999;background:#1a1a1a;color:#fff;padding:12px;overflow:auto;font:12px/1.4 monospace;white-space:pre-wrap';
  pre.textContent = `[meditate boot]\n${msg}`;
  document.body.appendChild(pre);
}

window.addEventListener('error', (e) => bootError(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => bootError(e.reason));

function kickoffVkInit() {
  if (!inVk) return;
  try {
    const w = window as Window & { __vkInitPromise?: Promise<unknown> };
    if (!w.__vkInitPromise) {
      w.__vkInitPromise = bridge.send('VKWebAppInit');
    }
    void w.__vkInitPromise.catch((err) => bootError(err));
  } catch (err) {
    bootError(err);
  }
}

if (!inVk) {
  registerSW();
} else {
  kickoffVkInit();
}

const Router = inVk ? HashRouter : BrowserRouter;

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Router>
        <App />
      </Router>
    </StrictMode>,
  );
} catch (err) {
  bootError(err);
}
