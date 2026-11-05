import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/ameaca-biologica-webapp/',
  server: mode === 'lan' ? {
    host: '0.0.0.0',
    port: 4174,
    strictPort: true,
    // O servidor de desenvolvimento fica acessível somente na rede confiável
    // escolhida pelo operador. Não use este modo em redes públicas.
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:4175', changeOrigin: false },
      '/ws': { target: 'ws://127.0.0.1:4175', changeOrigin: false, ws: true },
    },
  } : undefined,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return id.includes('@supabase') ? 'supabase' : 'vendor';
        },
      },
    },
  },
}));
