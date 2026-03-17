// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/images': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/scores': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/avatars': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/banners': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }, 
    hmr: {
      overlay: true // ⭐ 开启浏览器红屏错误
    }
  },    
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }

  }
})