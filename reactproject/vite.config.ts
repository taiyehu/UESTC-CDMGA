import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const target = 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    hmr: { overlay: true },
    proxy: {
      '/api': { target, changeOrigin: true },
      '/images': { target, changeOrigin: true },
      '/scores': { target, changeOrigin: true },
      '/avatars': { target, changeOrigin: true },
      '/banners': { target, changeOrigin: true },
      '/files': { target, changeOrigin: true },
    },
  },
})
