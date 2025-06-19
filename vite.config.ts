import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-dom', 'react-dom/client'],
    exclude: ['lucide-react'],
  },
  cacheDir: '.vite-cache',
  server: {
    watch: {
      usePolling: true,
    },
  },
});