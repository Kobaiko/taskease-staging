import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['framer-motion', 'canvas-confetti'],
      output: {
        globals: {
          'framer-motion': 'framerMotion',
          'canvas-confetti': 'canvasConfetti'
        }
      }
    }
  }
});