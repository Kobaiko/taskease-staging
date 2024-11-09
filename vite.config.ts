import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Environment-specific configuration
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: isDev ? {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    } : undefined
  },
  build: {
    outDir: 'dist',
    sourcemap: isDev,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.VITE_API_URL': JSON.stringify(isDev ? 'http://localhost:3001' : 'https://app.gettaskease.com')
  }
});