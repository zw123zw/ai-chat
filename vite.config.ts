import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'

// 👇 可选：根据部署环境动态设置 base 路径（推荐）
// 本地预览/部署到根路径：'./'；GitHub Pages 项目子页面：'/你的仓库名/'
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? './'  // 生产环境用相对路径（适配本地预览/GitHub Pages）
  : '/'   // 开发环境用根路径（不影响本地开发）

export default defineConfig({
  plugins: [vue(), vueJsx()],
  
  // 🔴 关键修改1：添加 base 配置（解决静态资源路径问题）
  base: BASE_URL,

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
    
    // 🔴 关键修改2：优化打包产物路径（可选，增强兼容性）
    assetsDir: 'assets', // 静态资源输出目录（默认就是 assets，显式声明更清晰）
    outDir: 'dist',      // 打包输出目录（默认 dist）
    rollupOptions: {
      // 确保静态资源路径解析正确
      output: {
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
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