/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      workbox: { cleanupOutdatedCaches: true },
      manifest: {
        name: 'Flashcards',
        short_name: 'Flashcards',
        description: 'Custom flashcard decks with spaced repetition, for any language or subject.',
        theme_color: '#f7f2ea',
        background_color: '#f7f2ea',
        display: 'standalone',
        start_url: '/',
        // The SVG mark from src/components/Logo.tsx — a real multi-resolution
        // PNG icon set (192/512, maskable) is a design task, not a code one;
        // this at least makes the manifest valid instead of iconless.
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Reviewed: with routes lazy-loaded (see router.tsx, ADR-0019), the
    // remaining ~650kB raw in the main chunk is react-dom + react-router +
    // @supabase/supabase-js's bundled sub-clients + i18next + TanStack Query
    // — all loaded eagerly by design (auth/i18n/data state are global) and
    // not realistically reducible without replacing a dependency outright.
    // Raised from Vite's 500kB default so the build doesn't warn on a
    // reviewed, justified baseline; a regression past this should still warn.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
  },
})
