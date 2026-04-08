import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
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
      },
    },
  },
});
