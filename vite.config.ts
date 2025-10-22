import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    },
    // Enable compression
    minify: 'terser',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  // Enable gzip compression
  server: {
    // Enable compression for development
  }
})
