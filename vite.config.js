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
        // Google Tag Manager should be handled directly by the browser 
        // to avoid Service Worker fetch rejections when blocked by ad-blockers.
        runtimeCaching: []
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
        picture_library: resolve(__dirname, 'picture-library.html'),
        spotlights_index: resolve(__dirname, 'spotlights-index.html'),
        spotlight: resolve(__dirname, 'spotlight.html'),
        templates_email: resolve(__dirname, 'templates-email.html'),
        templates_docs: resolve(__dirname, 'templates-docs.html'),
        audit_log: resolve(__dirname, 'audit-log.html'),
        communications: resolve(__dirname, 'communications.html'),
        contact: resolve(__dirname, 'contact.html'),
        documents: resolve(__dirname, 'documents.html'),
      },
    },
  },
});
