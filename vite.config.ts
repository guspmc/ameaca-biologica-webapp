import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ameaca-biologica-webapp/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return id.includes('@supabase') ? 'supabase' : 'vendor';
        },
      },
    },
  },
});
