import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'AuraFX',
      formats: ['es', 'umd'],
      fileName: (format) => `aurafx.${format === 'es' ? 'js' : 'umd.cjs'}`
    },
    rollupOptions: {
      external: [],
      output: {
        exports: 'named',
        globals: {
          aurafx: 'AuraFX'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'aurafx.css';
          }
          return assetInfo.name || 'assets/[name].[ext]';
        }
      }
    },
    minify: 'esbuild',
    sourcemap: true
  }
});
