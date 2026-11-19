import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const estaNoDocker = fs.existsSync('/.dockerenv');
const proxyTarget =
  process.env.VITE_API_PROXY_TARGET ||
  (estaNoDocker
    ? 'http://backend:3000'
    : process.env.VITE_API_URL || 'http://localhost:3000');

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
