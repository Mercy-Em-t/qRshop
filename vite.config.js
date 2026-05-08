import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update and reload the PWA when new code is pushed
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'The Modern Savannah',
        short_name: 'TMS',
        description: 'Premium marketplace for organic and natural products in Kenya.',
        theme_color: '#15803d',
        icons: [
          {
            src: 'modern_savannah_logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'modern_savannah_logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true, // Instantly remove old files to prevent conflict with fresh updates
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 // 4 MiB
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 2000, // Increase limit to 2MB to suppress warnings for large bundles
    rollupOptions: {
      external: [
        '@tauri-apps/plugin-notification'
      ]
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
