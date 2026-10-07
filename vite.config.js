import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'GELOCRIM Expedição',
        short_name: 'Expedição',
        description: 'App de expedição e conferência de carga - GELOCRIM',
        theme_color: '#1a5c36',
        background_color: '#1a5c36',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache estático (JS/CSS/imagens do app)
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Rotas de API nunca ficam em cache — sempre busca no servidor
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/painel-operacional-production.*railway\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
})
