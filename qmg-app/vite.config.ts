import { defineConfig } from 'vite'
// @ts-ignore
import uni from '@dcloudio/vite-plugin-uni'
// @ts-ignore
import path from 'path'
// @ts-ignore
import { fileURLToPath } from 'url'

// @ts-ignore
const __dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

