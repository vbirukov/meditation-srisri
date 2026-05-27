export function registerSW() {
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
