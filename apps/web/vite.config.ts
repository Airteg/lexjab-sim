import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves the site at https://airteg.github.io/lexjab-sim/
export default defineConfig({
  base: '/lexjab-sim/',
  plugins: [react()],
  worker: { format: 'es' },
});
