import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: {
      origin: process.env.VITE_API_URL || true,
      credentials: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
