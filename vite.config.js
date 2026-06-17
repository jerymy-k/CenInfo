import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'CenInfo',
        short_name: 'CenInfo',
        description: 'Discover and track your favorite movies and series.',
        theme_color: '#0a0014',
        background_color: '#0a0014',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  preview: {
    allowedHosts: ['elkeymycinema.up.railway.app']
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})