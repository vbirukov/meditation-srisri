import { isVkMiniApp } from '@/utils/vk';

export function registerSW() {
  // VK WebView: SW держит старый shell и мешает деплоям. Offline — только PWA.
  if (isVkMiniApp()) return;
  if ('serviceWorker' in navigator) {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onOfflineReady() {
          console.info('[PWA] Ready for offline use');
        },
      });
    });
  }
}
