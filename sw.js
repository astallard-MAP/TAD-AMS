/* 
  Cash 4 Houses Service Worker (2026 Hardened)
  Resolves net::ERR_FAILED conflicts with Google Tag Manager
*/

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-Only for Google Tag Manager to avoid SW interception conflicts
  if (url.hostname === 'www.googletagmanager.com' || url.hostname === 'googletagmanager.com') {
    return; // Browser handles this directly via network
  }

  // Optional: Add other caching logic here if needed, 
  // but for now we follow the 'system health check' directive.
});
