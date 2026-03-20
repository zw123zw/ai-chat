import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@import "@/assets/styles/variables.less";',
        javascriptEnabled: true,
      },
    },
  },
  build: {
    target: ['chrome87', 'firefox78', 'safari14', 'edge88'],
    cssTarget: ['chrome87', 'firefox78', 'safari14', 'edge88'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
