import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-pwa.png'],
      manifest: {
        name: 'Givago',
        short_name: 'Givago',
        description: 'Orçamentos e contratos para shows',
        theme_color: '#0f0f13',
        background_color: '#0f0f13',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon-pwa.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-pwa.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cacheia todos os assets estáticos gerados pelo Vite
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // PNGs (ícones grandes) ficam fora do precache — o browser os cacheia normalmente
        globIgnores: ['**/*.png'],
        // Não cacheia chamadas ao webhook N8N
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/webhook/],
        runtimeCaching: [
          {
            // Google Fonts — cache longo (1 ano)
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
})
