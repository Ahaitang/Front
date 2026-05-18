import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://192.168.1.2:8080',
        changeOrigin: true
      },
      '/ws': {
        target: 'http://192.168.1.2:8080',
        changeOrigin: true,
        ws: true
      }
    }
  }
})