import { resolve } from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'Cash 4 Houses',
        short_name: 'C4H',
        description: 'Fast property sales in South East Essex',
        theme_color: '#10b981',
        icons: [
          {
            src: 'favicon.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/gtag/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.googletagmanager\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-analytics',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        performance: resolve(__dirname, 'performance.html'),
        seo: resolve(__dirname, 'seo-update.html'),
        library: resolve(__dirname, 'library.html'),
        social: resolve(__dirname, 'social.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        cookies: resolve(__dirname, 'cookies.html'),
        terms: resolve(__dirname, 'terms.html'),
        sitemap: resolve(__dirname, 'sitemap.html'),
        profile: resolve(__dirname, 'profile.html'),
      },
    },
  },
});
