import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server on :3000, proxying /api calls to the Express server on :5000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
