import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' para o Electron carregar dist/index.html via file://
export default defineConfig({
  base: './',
  plugins: [react()],
});
