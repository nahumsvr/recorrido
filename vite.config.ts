import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { sanitizeOverrides } from './src/cameras/cameraOverrides.ts';

const OVERRIDES_FILE = fileURLToPath(new URL('./src/data/cameraOverrides.json', import.meta.url));
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Dev-only endpoint behind the camera editor's "Save to project" button. It
 * rewrites src/data/cameraOverrides.json (a fixed path) with the sanitized
 * payload; nothing from the request chooses the file name or its content shape.
 */
function cameraOverridesSave(): Plugin {
  return {
    name: 'camera-overrides-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/camera-overrides', (req, res) => {
        const fail = (code: number, message: string): void => {
          res.statusCode = code;
          res.end(message);
        };
        if (req.method !== 'POST') return fail(405, 'POST only');
        const origin = req.headers.origin;
        if (origin && origin !== `http://${req.headers.host}`) return fail(403, 'cross-origin request refused');
        if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) return fail(415, 'JSON only');

        const chunks: Buffer[] = [];
        let size = 0;
        req.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BODY_BYTES) {
            fail(413, 'payload too large');
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });
        req.on('end', () => {
          if (res.writableEnded) return;
          try {
            const clean = sanitizeOverrides(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            void writeFile(OVERRIDES_FILE, `${JSON.stringify(clean, null, 2)}\n`).then(
              () => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ saved: Object.keys(clean).length }));
              },
              () => fail(500, 'could not write the file'),
            );
          } catch {
            fail(400, 'invalid JSON');
          }
        });
      });
    },
  };
}

// `vite build` → dist/ with hashed assets; `vite build --mode single` → one self-contained HTML.
export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    target: 'es2022',
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? Number.MAX_SAFE_INTEGER : 4096,
  },
  plugins: mode === 'single' ? [viteSingleFile()] : [cameraOverridesSave()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
}));
