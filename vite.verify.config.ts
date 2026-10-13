import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Builds the challenge-check harness (verify/) for scripts/verify-challenges.ts. A separate config
// from vite.config.ts so none of it ends up in the app bundle. The script passes its own outDir.
export default defineConfig({
  root: fileURLToPath(new URL('./verify', import.meta.url)),
  base: './',
  publicDir: false,
  logLevel: 'warn',
  build: {
    outDir: fileURLToPath(new URL('./.verify-dist', import.meta.url)),
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    reportCompressedSize: false,
  },
});
