import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './api';

// Urutan prioritas: .env.local lalu .env (file yang di-ignore oleh git).
dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const thisFile = fileURLToPath(import.meta.url);
// `npm run dev` -> server/index.ts (development). `npm start` -> server.js hasil build (production).
const isProduction = process.env.NODE_ENV === 'production' || path.basename(thisFile) === 'server.js';
const port = Number(process.env.PORT) || 3000;

async function start() {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', 1);

  // Header keamanan dasar. (CSP sengaja tidak dipasang agar Google Maps/Fonts tidak terblokir;
  // tambahkan CSP yang sesuai saat produksi.)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self)');
    next();
  });

  app.use('/api', createApiRouter());

  if (isProduction) {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      console.error('Folder dist/ tidak ditemukan. Jalankan `npm run build` terlebih dahulu.');
      process.exit(1);
    }
    app.use(
      express.static(distDir, {
        index: false,
        setHeaders(res, filePath) {
          // Aset ber-hash boleh di-cache lama; sisanya (index.html, sw.js, manifest) selalu divalidasi ulang.
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      }),
    );
    // SPA fallback (kecuali /api).
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LAPORIN berjalan di http://localhost:${port} (${isProduction ? 'production' : 'development'})`);
    const mode = (process.env.AI_MODE ?? 'REAL_AI').toUpperCase();
    if (mode === 'REAL_AI' && !process.env.GEMINI_API_KEY) {
      console.warn('! GEMINI_API_KEY belum diisi: validasi AI akan mengembalikan error NOT_CONFIGURED.');
      console.warn('  Isi .env.local, atau pakai AI_MODE=MOCK_AI untuk development tanpa API key.');
    }
    if (mode === 'MOCK_AI') console.warn('! AI_MODE=MOCK_AI: hasil AI hanya simulasi (ditandai MOCK di UI).');
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
