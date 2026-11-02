export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('RupeeTrack ServiceWorker registered successfully: ', registration.scope);
        })
        .catch((err) => {
          console.warn('RupeeTrack ServiceWorker registration note: ', err);
        });
    });
  }
}
