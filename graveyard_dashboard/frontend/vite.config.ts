import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Use relative paths for static deployment (works on any hosting path)
  base: './',

  server: {
    port: 5174,
    // Proxy kept for local development with backend (optional)
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Optimized chunk splitting to reduce bundle sizes
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          map: ['maplibre-gl'],
          charts: ['echarts', 'echarts-for-react'],
          table: ['@tanstack/react-table']
        }
      }
    }
  }
})
