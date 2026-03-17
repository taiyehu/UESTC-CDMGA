// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'css' })],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus') || id.includes('@element-plus')) {
              const componentMatch = id.match(/element-plus\/es\/components\/([^/]+)/)
              if (componentMatch?.[1]) return `el-${componentMatch[1]}`
              return 'vendor-element-core'
            }
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vendor-vue'
            return 'vendor-misc'
          }
        },
      },
    },
  },
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