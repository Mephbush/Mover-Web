import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    // Exclude Node.js-only modules from dependency pre-bundling
    exclude: ['playwright', './utils/stealth-browser', './utils/smart-task-executor'],
  },
});
