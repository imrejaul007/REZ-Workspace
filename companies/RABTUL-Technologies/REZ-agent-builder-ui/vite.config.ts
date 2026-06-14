import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4303,
    proxy: {
      '/api': {
        target: 'http://localhost:4062',
        changeOrigin: true,
      },
    },
  },
});
