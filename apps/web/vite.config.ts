/// <reference types="vitest/config" />
import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * index.html carries nginx server-side include markers (per-page SEO tags,
 * see nginx.conf). The dev server doesn't run them, so there it shows the
 * fallback block as plain HTML; the build keeps the markers for nginx.
 */
function ssiFallbacksInDev(): Plugin {
  return {
    name: 'ssi-fallbacks-in-dev',
    apply: 'serve',
    transformIndexHtml: (html) => html.replace(/<!--#[^>]*-->/g, ''),
  };
}

// Where /api goes when mocks are off. The Go API listens on :8080 by default.
const apiProxy = {
  '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:8080', changeOrigin: true },
};

export default defineConfig({
  plugins: [react(), ssiFallbacksInDev()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries change rarely; separate chunks stay cached across deploys.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: ['@tanstack/react-query', 'i18next', 'react-i18next', 'zustand'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },
  },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
    include: ['src/**/*.{test,integration.test}.{ts,tsx}'],
    css: false,
  },
});
