import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import bridge from '@vkontakte/vk-bridge';
import { App } from './App';
import './styles/global.css';
import { registerSW } from './pwa/registerSW';
import { isVkMiniApp } from './utils/vk';

const inVk = isVkMiniApp();
if (inVk) {
  // index.html уже шлёт Init; повтор если HTML-скрипт не сработал
  if (!(window as Window & { __vkInitPromise?: Promise<unknown> }).__vkInitPromise) {
    void bridge.send('VKWebAppInit');
  }
} else {
  registerSW();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
