import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://172.16.29.181:8080', 
        changeOrigin: true,
        secure: false, 
      },
      // Proxy hình ảnh
      '/uploads': {
        target: 'http://172.16.29.181:8080', 
        changeOrigin: true,
        secure: false, 
      },
    },
  },
})