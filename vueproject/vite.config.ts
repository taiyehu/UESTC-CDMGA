// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
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