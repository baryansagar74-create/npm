import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: false
  },
  resolve: {
    alias: {
      aurafx: resolve(import.meta.dirname, 'src/index.ts')
    }
  }
});
