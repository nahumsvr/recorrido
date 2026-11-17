import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `vite build` → dist/ with hashed assets; `vite build --mode single` → one self-contained HTML.
export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    target: 'es2022',
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? Number.MAX_SAFE_INTEGER : 4096,
  },
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
}));
