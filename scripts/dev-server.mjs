// Local development server: static files + a TMDB proxy that mirrors the
// Cloudflare worker's /api/tmdb route, so the app gets live data on localhost.
//
//   node scripts/dev-server.mjs [port]
//
// Reads TMDB_API_KEY (v3 key) or TMDB_READ_TOKEN (v4 bearer) from .env.local,
// which is git-ignored. The key never reaches the browser.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.argv[2] || process.env.PORT || 8123);
const TMDB_PREFIX = '/api/tmdb';

function loadEnv() {
  const env = {};
  const file = join(ROOT, '.env.local');
  if (!existsSync(file)) return env;
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (match && !line.trim().startsWith('#')) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  });
  return env;
}

const env = loadEnv();
const apiKey = env.TMDB_API_KEY || process.env.TMDB_API_KEY || '';
const readToken = (env.TMDB_READ_TOKEN || process.env.TMDB_READ_TOKEN || '').replace(/^Bearer\s+/i, '');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

// In development the service worker would keep serving stale modules, so the
// dev server hands out one that removes itself and clears its caches.
const DEV_SERVICE_WORKER = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await self.registration.unregister();
  })());
});
`;

const DEV_INJECT = `<script>window.__POSTERBOXD_TMDB_PROXY_URL__ = location.origin + '${TMDB_PREFIX}';</script>`;

async function proxyTmdb(url, res) {
  if (!apiKey && !readToken) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Add TMDB_API_KEY to .env.local' }));
    return;
  }
  const target = new URL(`https://api.themoviedb.org/3${url.pathname.slice(TMDB_PREFIX.length) || '/configuration'}`);
  url.searchParams.forEach((value, key) => {
    if (key !== 'api_key') target.searchParams.append(key, value);
  });
  const headers = { Accept: 'application/json' };
  if (readToken) headers.Authorization = `Bearer ${readToken}`;
  else target.searchParams.set('api_key', apiKey);
  try {
    const upstream = await fetch(target, { headers });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'TMDB upstream request failed' }));
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  if (url.pathname === TMDB_PREFIX || url.pathname.startsWith(`${TMDB_PREFIX}/`)) {
    await proxyTmdb(url, res);
    return;
  }
  if (url.pathname === '/sw.js') {
    res.writeHead(200, { 'Content-Type': TYPES['.js'], 'Cache-Control': 'no-store' });
    res.end(DEV_SERVICE_WORKER);
    return;
  }

  let relative = decodeURIComponent(url.pathname);
  if (relative.endsWith('/')) relative += 'index.html';
  const filePath = normalize(join(ROOT, relative));
  const hidden = relative.split('/').some((part) => part.startsWith('.') && part.length > 1);
  if (hidden || (filePath !== ROOT && !filePath.startsWith(ROOT + sep))) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    let body = await readFile(filePath);
    const type = TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
    if (relative.endsWith('/index.html')) {
      body = Buffer.from(body.toString('utf8').replace('</head>', `${DEV_INJECT}\n</head>`));
    }
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`PosterBoxd dev server on http://localhost:${PORT}  (TMDB proxy: ${apiKey || readToken ? 'configured' : 'missing key'})`);
});
